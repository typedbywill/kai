#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QQuickWindow>
#include "config/Settings.h"
#include "api/OpenAIClient.h"
#include "KAIController.h"

#ifdef HAVE_KWINDOWSYSTEM
#include <KWindowEffects>
#endif

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);

    app.setOrganizationName("KDE");
    app.setOrganizationDomain("kde.org");
    app.setApplicationName("kai");
    app.setApplicationVersion("0.1.0");

    Settings settings;
    OpenAIClient client(&settings);
    KAIController controller;

    QQmlApplicationEngine engine;

    engine.rootContext()->setContextProperty("controller", &controller);
    engine.rootContext()->setContextProperty("appSettings", &settings);
    engine.rootContext()->setContextProperty("openAIClient", &client);

    const QUrl url(QStringLiteral("qrc:/ui/Overlay.qml"));
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreated,
                     &app, [url](QObject *obj, const QUrl &objUrl) {
        if (!obj && url == objUrl) {
            QCoreApplication::exit(-1);
        }
#ifdef HAVE_KWINDOWSYSTEM
        QQuickWindow *window = qobject_cast<QQuickWindow*>(obj);
        if (window) {
            KWindowEffects::enableBlurBehind(window, true);
        }
#endif
    }, Qt::QueuedConnection);
    engine.load(url);

    return app.exec();
}
