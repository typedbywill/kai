#ifndef SETTINGS_H
#define SETTINGS_H

#include <QObject>
#include <QString>

class Settings : public QObject
{
    Q_OBJECT
    Q_PROPERTY(QString endpoint READ endpoint WRITE setEndpoint NOTIFY endpointChanged)
    Q_PROPERTY(QString apiKey READ apiKey WRITE setApiKey NOTIFY apiKeyChanged)
    Q_PROPERTY(QString model READ model WRITE setModel NOTIFY modelChanged)
    Q_PROPERTY(double temperature READ temperature WRITE setTemperature NOTIFY temperatureChanged)
    Q_PROPERTY(int timeout READ timeout WRITE setTimeout NOTIFY timeoutChanged)
    Q_PROPERTY(bool restoreSession READ restoreSession WRITE setRestoreSession NOTIFY restoreSessionChanged)
    Q_PROPERTY(QString theme READ theme WRITE setTheme NOTIFY themeChanged)
    Q_PROPERTY(double opacity READ opacity WRITE setOpacity NOTIFY opacityChanged)

public:
    explicit Settings(QObject *parent = nullptr);

    QString endpoint() const;
    void setEndpoint(const QString &endpoint);

    QString apiKey() const;
    void setApiKey(const QString &apiKey);

    QString model() const;
    void setModel(const QString &model);

    double temperature() const;
    void setTemperature(double temperature);

    int timeout() const;
    void setTimeout(int timeout);

    bool restoreSession() const;
    void setRestoreSession(bool restoreSession);

    QString theme() const;
    void setTheme(const QString &theme);

    double opacity() const;
    void setOpacity(double opacity);

    Q_INVOKABLE void load();
    Q_INVOKABLE void save();

signals:
    void endpointChanged();
    void apiKeyChanged();
    void modelChanged();
    void temperatureChanged();
    void timeoutChanged();
    void restoreSessionChanged();
    void themeChanged();
    void opacityChanged();

private:
    QString m_endpoint;
    QString m_apiKey;
    QString m_model;
    double m_temperature;
    int m_timeout;
    bool m_restoreSession;
    QString m_theme;
    double m_opacity;

    QString configFilePath() const;
};

#endif // SETTINGS_H
