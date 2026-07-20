#include "KAIController.h"
#include <KGlobalAccel>
#include <QCoreApplication>
#include <QGuiApplication>
#include <QClipboard>
#include <QDebug>

KAIController::KAIController(QObject *parent)
    : QObject(parent)
    , m_shortcutAction(nullptr)
{
    registerShortcut();
}

void KAIController::registerShortcut()
{
    m_shortcutAction = new QAction(this);
    m_shortcutAction->setObjectName(QStringLiteral("toggle_kai_overlay"));
    m_shortcutAction->setText(QStringLiteral("Toggle KAI Overlay"));

    QList<QKeySequence> shortcuts = { QKeySequence(QStringLiteral("Meta+X")) };
    KGlobalAccel::self()->setDefaultShortcut(m_shortcutAction, shortcuts);
    KGlobalAccel::self()->setShortcut(m_shortcutAction, shortcuts);

    connect(m_shortcutAction, &QAction::triggered, this, &KAIController::toggleRequested);
    qDebug() << "Global shortcut Meta+X registered via KGlobalAccel";
}

void KAIController::quitApplication()
{
    QCoreApplication::quit();
}

void KAIController::copyToClipboard(const QString &text)
{
    QGuiApplication::clipboard()->setText(text);
}
