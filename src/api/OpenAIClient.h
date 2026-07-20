#ifndef OPENAICLIENT_H
#define OPENAICLIENT_H

#include <QObject>
#include <QVariantList>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include "../config/Settings.h"

class OpenAIClient : public QObject
{
    Q_OBJECT
    Q_PROPERTY(QVariantList chatHistory READ chatHistory NOTIFY chatHistoryChanged)
    Q_PROPERTY(bool isResponding READ isResponding NOTIFY isRespondingChanged)
    Q_PROPERTY(QString currentResponse READ currentResponse NOTIFY currentResponseChanged)
    Q_PROPERTY(QVariantList conversationsList READ conversationsList NOTIFY conversationsListChanged)

public:
    explicit OpenAIClient(Settings *settings, QObject *parent = nullptr);

    QVariantList chatHistory() const;
    bool isResponding() const;
    QString currentResponse() const;
    QVariantList conversationsList() const;

    Q_INVOKABLE void sendMessage(const QString &message);
    Q_INVOKABLE void clearConversation();
    Q_INVOKABLE void cancelRequest();
    Q_INVOKABLE void loadConversation(const QString &id);
    Q_INVOKABLE void deleteConversation(const QString &id);
    Q_INVOKABLE void clearAllHistory();

signals:
    void chatHistoryChanged();
    void isRespondingChanged();
    void currentResponseChanged();
    void errorOccurred(const QString &errorMsg);
    void finished();
    void conversationsListChanged();

private slots:
    void onReadyRead();
    void onFinished();
    void onError(QNetworkReply::NetworkError code);

private:
    Settings *m_settings;
    QNetworkAccessManager m_networkManager;
    QNetworkReply *m_reply;
    QVariantList m_chatHistory;
    bool m_isResponding;
    QString m_currentResponse;
    QByteArray m_buffer;
    QVariantList m_conversations;
    QString m_currentConversationId;

    void setResponding(bool responding);
    void appendMessage(const QString &role, const QString &content, bool isError = false);
    void updateLastMessage(const QString &content, bool isError = false);
    void processBuffer();
    void loadHistory();
    void saveHistory();
    QString historyFilePath() const;
};

#endif // OPENAICLIENT_H
