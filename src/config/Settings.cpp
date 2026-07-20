#include "Settings.h"
#include <QFile>
#include <QDir>
#include <QJsonDocument>
#include <QJsonObject>
#include <QStandardPaths>
#include <QDebug>

Settings::Settings(QObject *parent)
    : QObject(parent)
    , m_endpoint("https://api.openai.com/v1")
    , m_apiKey("")
    , m_model("gpt-4o-mini")
    , m_temperature(0.7)
    , m_timeout(30)
    , m_restoreSession(false)
    , m_theme("system")
    , m_opacity(0.85)
{
    load();
}

QString Settings::configFilePath() const
{
    QString configDir = QStandardPaths::writableLocation(QStandardPaths::AppConfigLocation);
    QDir().mkpath(configDir);
    return configDir + "/config.json";
}

void Settings::load()
{
    QFile file(configFilePath());
    if (!file.open(QIODevice::ReadOnly)) {
        qWarning() << "Could not open config file for reading, using defaults:" << configFilePath();
        return;
    }

    QByteArray data = file.readAll();
    QJsonDocument doc = QJsonDocument::fromJson(data);
    if (doc.isNull() || !doc.isObject()) {
        qWarning() << "Invalid config JSON format";
        return;
    }

    QJsonObject obj = doc.object();
    if (obj.contains("endpoint")) {
        m_endpoint = obj["endpoint"].toString();
        emit endpointChanged();
    }
    if (obj.contains("apiKey")) {
        m_apiKey = obj["apiKey"].toString();
        emit apiKeyChanged();
    }
    if (obj.contains("model")) {
        m_model = obj["model"].toString();
        emit modelChanged();
    }
    if (obj.contains("temperature")) {
        m_temperature = obj["temperature"].toDouble(0.7);
        emit temperatureChanged();
    }
    if (obj.contains("timeout")) {
        m_timeout = obj["timeout"].toInt(30);
        emit timeoutChanged();
    }
    if (obj.contains("restoreSession")) {
        m_restoreSession = obj["restoreSession"].toBool(false);
        emit restoreSessionChanged();
    }
    if (obj.contains("theme")) {
        m_theme = obj["theme"].toString();
        emit themeChanged();
    }
    if (obj.contains("opacity")) {
        m_opacity = obj["opacity"].toDouble(0.85);
        emit opacityChanged();
    }
}

void Settings::save()
{
    QFile file(configFilePath());
    if (!file.open(QIODevice::WriteOnly)) {
        qWarning() << "Could not open config file for writing:" << configFilePath();
        return;
    }

    QJsonObject obj;
    obj["endpoint"] = m_endpoint;
    obj["apiKey"] = m_apiKey;
    obj["model"] = m_model;
    obj["temperature"] = m_temperature;
    obj["timeout"] = m_timeout;
    obj["restoreSession"] = m_restoreSession;
    obj["theme"] = m_theme;
    obj["opacity"] = m_opacity;

    QJsonDocument doc(obj);
    file.write(doc.toJson());
    file.close();
}

QString Settings::endpoint() const { return m_endpoint; }
void Settings::setEndpoint(const QString &endpoint) {
    if (m_endpoint != endpoint) {
        m_endpoint = endpoint;
        emit endpointChanged();
    }
}

QString Settings::apiKey() const { return m_apiKey; }
void Settings::setApiKey(const QString &apiKey) {
    if (m_apiKey != apiKey) {
        m_apiKey = apiKey;
        emit apiKeyChanged();
    }
}

QString Settings::model() const { return m_model; }
void Settings::setModel(const QString &model) {
    if (m_model != model) {
        m_model = model;
        emit modelChanged();
    }
}

double Settings::temperature() const { return m_temperature; }
void Settings::setTemperature(double temperature) {
    if (!qFuzzyCompare(m_temperature, temperature)) {
        m_temperature = temperature;
        emit temperatureChanged();
    }
}

int Settings::timeout() const { return m_timeout; }
void Settings::setTimeout(int timeout) {
    if (m_timeout != timeout) {
        m_timeout = timeout;
        emit timeoutChanged();
    }
}

bool Settings::restoreSession() const { return m_restoreSession; }
void Settings::setRestoreSession(bool restoreSession) {
    if (m_restoreSession != restoreSession) {
        m_restoreSession = restoreSession;
        emit restoreSessionChanged();
    }
}

QString Settings::theme() const { return m_theme; }
void Settings::setTheme(const QString &theme) {
    if (m_theme != theme) {
        m_theme = theme;
        emit themeChanged();
    }
}

double Settings::opacity() const { return m_opacity; }
void Settings::setOpacity(double opacity) {
    if (!qFuzzyCompare(m_opacity, opacity)) {
        m_opacity = opacity;
        emit opacityChanged();
    }
}
