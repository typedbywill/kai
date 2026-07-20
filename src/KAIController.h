#ifndef KAICONTROLLER_H
#define KAICONTROLLER_H

#include <QObject>
#include <QAction>

class KAIController : public QObject
{
    Q_OBJECT
public:
    explicit KAIController(QObject *parent = nullptr);

    Q_INVOKABLE void quitApplication();
    Q_INVOKABLE void registerShortcut();
    Q_INVOKABLE void copyToClipboard(const QString &text);

signals:
    void toggleRequested();

private:
    QAction *m_shortcutAction;
};

#endif // KAICONTROLLER_H
