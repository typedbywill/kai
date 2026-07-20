#include "OpenAIClient.h"
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QVariantMap>
#include <QUrl>
#include <QNetworkRequest>
#include <QStandardPaths>
#include <QDir>
#include <QFile>
#include <QDebug>

OpenAIClient::OpenAIClient(Settings *settings, QObject *parent)
    : QObject(parent)
    , m_settings(settings)
    , m_reply(nullptr)
    , m_isResponding(false)
{
    if (m_settings->restoreSession()) {
        loadHistory();
    }
}

QVariantList OpenAIClient::chatHistory() const
{
    return m_chatHistory;
}

bool OpenAIClient::isResponding() const
{
    return m_isResponding;
}

QString OpenAIClient::currentResponse() const
{
    return m_currentResponse;
}

void OpenAIClient::setResponding(bool responding)
{
    if (m_isResponding != responding) {
        m_isResponding = responding;
        emit isRespondingChanged();
    }
}

void OpenAIClient::appendMessage(const QString &role, const QString &content, bool isError)
{
    QVariantMap msg;
    msg["role"] = role;
    msg["content"] = content;
    msg["isError"] = isError;
    m_chatHistory.append(msg);
    emit chatHistoryChanged();
}

void OpenAIClient::updateLastMessage(const QString &content, bool isError)
{
    if (m_chatHistory.isEmpty()) return;
    QVariantMap lastMsg = m_chatHistory.last().toMap();
    lastMsg["content"] = content;
    lastMsg["isError"] = isError;
    m_chatHistory[m_chatHistory.size() - 1] = lastMsg;
    emit chatHistoryChanged();
}

void OpenAIClient::sendMessage(const QString &message)
{
    if (m_isResponding) return;

    // Append user message
    appendMessage("user", message);

    // Prepare helper properties for Assistant message
    m_currentResponse = "";
    emit currentResponseChanged();
    setResponding(true);

    // Append assistant placeholder message
    appendMessage("assistant", "");

    saveHistory();

    // Prepare JSON payload
    QJsonObject payload;
    payload["model"] = m_settings->model();
    payload["temperature"] = m_settings->temperature();
    payload["stream"] = true;

    // Messages history array
    QJsonArray messagesArray;
    QJsonObject systemMsg;
    systemMsg["role"] = "system";
    systemMsg["content"] = "You are KAI, a helpful and concise KDE desktop AI assistant. Keep responses focused, brief and highly structured. Format everything nicely in Markdown.";
    messagesArray.append(systemMsg);

    // Add all prior messages (except error messages and the assistant placeholder we just added)
    for (int i = 0; i < m_chatHistory.size() - 1; ++i) {
        QVariantMap msg = m_chatHistory[i].toMap();
        if (msg["isError"].toBool()) continue;
        
        QJsonObject msgObj;
        msgObj["role"] = msg["role"].toString();
        msgObj["content"] = msg["content"].toString();
        messagesArray.append(msgObj);
    }

    payload["messages"] = messagesArray;

    QJsonDocument doc(payload);
    QByteArray jsonData = doc.toJson();

    // Format endpoint url
    QString endpointStr = m_settings->endpoint();
    if (endpointStr.endsWith("/")) {
        endpointStr.chop(1);
    }
    if (!endpointStr.endsWith("/chat/completions")) {
        endpointStr += "/chat/completions";
    }

    QUrl url(endpointStr);
    QNetworkRequest request(url);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    
    // Auth header
    QString apiKey = m_settings->apiKey();
    if (!apiKey.isEmpty()) {
        request.setRawHeader("Authorization", ("Bearer " + apiKey).toUtf8());
    }

    // Set timeout
    request.setTransferTimeout(m_settings->timeout() * 1000);

    m_buffer.clear();
    
    m_reply = m_networkManager.post(request, jsonData);

    connect(m_reply, &QNetworkReply::readyRead, this, &OpenAIClient::onReadyRead);
    connect(m_reply, &QNetworkReply::finished, this, &OpenAIClient::onFinished);
    connect(m_reply, &QNetworkReply::errorOccurred, this, &OpenAIClient::onError);
}

void OpenAIClient::cancelRequest()
{
    if (m_reply) {
        m_reply->abort();
    }
    setResponding(false);
}

void OpenAIClient::clearConversation()
{
    cancelRequest();
    m_chatHistory.clear();
    m_currentResponse = "";
    saveHistory();
    emit chatHistoryChanged();
    emit currentResponseChanged();
}

void OpenAIClient::onReadyRead()
{
    if (!m_reply) return;
    m_buffer.append(m_reply->readAll());
    processBuffer();
}

void OpenAIClient::processBuffer()
{
    int index;
    while ((index = m_buffer.indexOf('\n')) != -1) {
        QByteArray line = m_buffer.left(index).trimmed();
        m_buffer.remove(0, index + 1);

        if (line.isEmpty()) continue;

        if (line.startsWith("data:")) {
            QByteArray dataContent = line.mid(5).trimmed();

            if (dataContent == "[DONE]") {
                continue;
            }

            QJsonDocument doc = QJsonDocument::fromJson(dataContent);
            if (doc.isNull() || !doc.isObject()) {
                continue;
            }

            QJsonObject obj = doc.object();
            if (obj.contains("choices") && obj["choices"].isArray()) {
                QJsonArray choices = obj["choices"].toArray();
                if (!choices.isEmpty()) {
                    QJsonObject choice = choices.first().toObject();
                    if (choice.contains("delta") && choice["delta"].isObject()) {
                        QJsonObject delta = choice["delta"].toObject();
                        if (delta.contains("content")) {
                            QString contentChunk = delta["content"].toString();
                            m_currentResponse += contentChunk;
                            updateLastMessage(m_currentResponse);
                            emit currentResponseChanged();
                        }
                    }
                }
            }
        }
    }
}

void OpenAIClient::onError(QNetworkReply::NetworkError code)
{
    Q_UNUSED(code);
    if (!m_reply) return;
    QString errorMsg = m_reply->errorString();
    
    // Check if error response has body details
    QByteArray body = m_reply->readAll();
    if (!body.isEmpty()) {
        QJsonDocument doc = QJsonDocument::fromJson(body);
        if (!doc.isNull() && doc.isObject()) {
            QJsonObject obj = doc.object();
            if (obj.contains("error") && obj["error"].isObject()) {
                QJsonObject errObj = obj["error"].toObject();
                if (errObj.contains("message")) {
                    errorMsg = errObj["message"].toString();
                }
            }
        }
    }

    updateLastMessage("Erro: " + errorMsg, true);
    saveHistory();
    emit errorOccurred(errorMsg);
}

void OpenAIClient::onFinished()
{
    if (m_reply) {
        processBuffer();
        m_reply->deleteLater();
        m_reply = nullptr;
    }
    setResponding(false);
    saveHistory();
    emit finished();
}

QString OpenAIClient::historyFilePath() const
{
    QString configDir = QStandardPaths::writableLocation(QStandardPaths::AppConfigLocation);
    QDir().mkpath(configDir);
    return configDir + "/history.json";
}

void OpenAIClient::saveHistory()
{
    QFile file(historyFilePath());
    if (!file.open(QIODevice::WriteOnly)) {
        qWarning() << "Could not open history file for writing:" << historyFilePath();
        return;
    }

    QJsonArray array;
    for (const QVariant &msgVar : m_chatHistory) {
        QVariantMap msgMap = msgVar.toMap();
        QJsonObject obj;
        obj["role"] = msgMap["role"].toString();
        obj["content"] = msgMap["content"].toString();
        obj["isError"] = msgMap["isError"].toBool();
        array.append(obj);
    }

    QJsonDocument doc(array);
    file.write(doc.toJson());
    file.close();
}

void OpenAIClient::loadHistory()
{
    QFile file(historyFilePath());
    if (!file.open(QIODevice::ReadOnly)) {
        return;
    }

    QByteArray data = file.readAll();
    QJsonDocument doc = QJsonDocument::fromJson(data);
    if (doc.isNull() || !doc.isArray()) {
        qWarning() << "Invalid history JSON format";
        return;
    }

    m_chatHistory.clear();
    QJsonArray array = doc.array();
    for (const QJsonValue &value : array) {
        if (value.isObject()) {
            QJsonObject obj = value.toObject();
            QVariantMap msg;
            msg["role"] = obj["role"].toString();
            msg["content"] = obj["content"].toString();
            msg["isError"] = obj["isError"].toBool();
            m_chatHistory.append(msg);
        }
    }
    emit chatHistoryChanged();
}
