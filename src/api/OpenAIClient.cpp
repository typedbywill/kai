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
#include <QDateTime>
#include <algorithm>
#include <QDebug>

OpenAIClient::OpenAIClient(Settings *settings, QObject *parent)
    : QObject(parent)
    , m_settings(settings)
    , m_reply(nullptr)
    , m_isResponding(false)
{
    loadHistory(); // Always load the history database on startup
    
    if (m_settings->restoreSession() && !m_conversations.isEmpty()) {
        QString latestId;
        qint64 latestTime = -1;
        for (const QVariant &convVar : m_conversations) {
            QVariantMap convMap = convVar.toMap();
            qint64 time = convMap["timestamp"].toLongLong();
            if (time > latestTime) {
                latestTime = time;
                latestId = convMap["id"].toString();
            }
        }
        if (!latestId.isEmpty()) {
            loadConversation(latestId);
        }
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

QVariantList OpenAIClient::conversationsList() const
{
    return m_conversations;
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

    // Generate new conversation ID and title if we are starting a fresh chat
    if (m_currentConversationId.isEmpty()) {
        m_currentConversationId = QString::number(QDateTime::currentMSecsSinceEpoch());
        QString title = message.trimmed();
        if (title.length() > 40) {
            title = title.left(37) + "...";
        }
        
        QVariantMap newConv;
        newConv["id"] = m_currentConversationId;
        newConv["title"] = title;
        newConv["timestamp"] = QDateTime::currentMSecsSinceEpoch();
        newConv["messages"] = QVariantList();
        
        m_conversations.prepend(newConv);
        emit conversationsListChanged();
    }

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
    m_currentConversationId = "";
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
    if (!m_currentConversationId.isEmpty()) {
        for (int i = 0; i < m_conversations.size(); ++i) {
            QVariantMap convMap = m_conversations[i].toMap();
            if (convMap["id"].toString() == m_currentConversationId) {
                convMap["messages"] = m_chatHistory;
                convMap["timestamp"] = QDateTime::currentMSecsSinceEpoch();
                m_conversations[i] = convMap;
                emit conversationsListChanged();
                break;
            }
        }
    }

    QFile file(historyFilePath());
    if (!file.open(QIODevice::WriteOnly)) {
        qWarning() << "Could not open history file for writing:" << historyFilePath();
        return;
    }

    QJsonArray rootArray;
    for (const QVariant &convVar : m_conversations) {
        QVariantMap convMap = convVar.toMap();
        QJsonObject convObj;
        convObj["id"] = convMap["id"].toString();
        convObj["title"] = convMap["title"].toString();
        convObj["timestamp"] = convMap["timestamp"].toLongLong();

        QJsonArray msgArray;
        QVariantList msgs = convMap["messages"].toList();
        for (const QVariant &msgVar : msgs) {
            QVariantMap msgMap = msgVar.toMap();
            QJsonObject msgObj;
            msgObj["role"] = msgMap["role"].toString();
            msgObj["content"] = msgMap["content"].toString();
            msgObj["isError"] = msgMap["isError"].toBool();
            msgArray.append(msgObj);
        }
        convObj["messages"] = msgArray;
        rootArray.append(convObj);
    }

    QJsonDocument doc(rootArray);
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

    m_conversations.clear();
    QJsonArray rootArray = doc.array();
    for (const QJsonValue &convVal : rootArray) {
        if (convVal.isObject()) {
            QJsonObject convObj = convVal.toObject();
            QVariantMap convMap;
            convMap["id"] = convObj["id"].toString();
            convMap["title"] = convObj["title"].toString();
            convMap["timestamp"] = convObj["timestamp"].toVariant().toLongLong();

            QVariantList msgs;
            QJsonArray msgArray = convObj["messages"].toArray();
            for (const QJsonValue &msgVal : msgArray) {
                if (msgVal.isObject()) {
                    QJsonObject msgObj = msgVal.toObject();
                    QVariantMap msgMap;
                    msgMap["role"] = msgObj["role"].toString();
                    msgMap["content"] = msgObj["content"].toString();
                    msgMap["isError"] = msgObj["isError"].toBool();
                    msgs.append(msgMap);
                }
            }
            convMap["messages"] = msgs;
            m_conversations.append(convMap);
        }
    }

    std::sort(m_conversations.begin(), m_conversations.end(), [](const QVariant &a, const QVariant &b) {
        return a.toMap()["timestamp"].toLongLong() > b.toMap()["timestamp"].toLongLong();
    });

    emit conversationsListChanged();
}

void OpenAIClient::loadConversation(const QString &id)
{
    cancelRequest();
    m_currentConversationId = id;
    
    for (const QVariant &convVar : m_conversations) {
        QVariantMap convMap = convVar.toMap();
        if (convMap["id"].toString() == id) {
            m_chatHistory = convMap["messages"].toList();
            m_currentResponse = "";
            emit chatHistoryChanged();
            emit currentResponseChanged();
            break;
        }
    }
}

void OpenAIClient::deleteConversation(const QString &id)
{
    for (int i = 0; i < m_conversations.size(); ++i) {
        if (m_conversations[i].toMap()["id"].toString() == id) {
            m_conversations.removeAt(i);
            break;
        }
    }
    
    if (m_currentConversationId == id) {
        clearConversation();
    }
    
    saveHistory();
    emit conversationsListChanged();
}

void OpenAIClient::clearAllHistory()
{
    cancelRequest();
    m_chatHistory.clear();
    m_conversations.clear();
    m_currentConversationId = "";
    m_currentResponse = "";
    
    QFile file(historyFilePath());
    file.remove();
    
    emit chatHistoryChanged();
    emit currentResponseChanged();
    emit conversationsListChanged();
}
