import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import org.kde.kirigami as Kirigami

Kirigami.ApplicationWindow {
    id: root
    width: 800
    height: 500
    title: "KAI"

    // Center window on screen
    x: (Screen.width - width) / 2
    y: (Screen.height - height) / 2

    // Frameless, stays on top, tool window (doesn't show in taskbar)
    flags: Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint | Qt.Tool
    color: "transparent"

    // Hide window when it loses focus
    onActiveChanged: {
        if (!active) {
            root.hide();
        }
    }

    // Theme and customization variables
    readonly property bool useSystemTheme: appSettings.theme === "system"
    readonly property bool forceDark: appSettings.theme === "dark"
    readonly property bool forceLight: appSettings.theme === "light"
    
    readonly property bool isDarkTheme: forceDark || (useSystemTheme && Kirigami.Theme.textColor.r > 0.5)

    readonly property color customBgColor: isDarkTheme ? "#232425" : "#fcfcfc"
    readonly property color customTextColor: isDarkTheme ? "#eff0f1" : "#232425"
    readonly property color customAltBgColor: isDarkTheme ? "#1b1c1d" : "#f3f4f6"

    readonly property color activeBgColor: useSystemTheme ? Kirigami.Theme.backgroundColor : customBgColor
    readonly property color activeTextColor: useSystemTheme ? Kirigami.Theme.textColor : customTextColor
    readonly property color activeAltBgColor: useSystemTheme ? Kirigami.Theme.alternateBackgroundColor : customAltBgColor
    readonly property color activeHighlightColor: Kirigami.Theme.highlightColor
    readonly property color activeFocusColor: Kirigami.Theme.focusColor
    readonly property color activeNegativeTextColor: Kirigami.Theme.negativeTextColor
    readonly property color activeDisabledTextColor: Kirigami.Theme.disabledTextColor

    readonly property color separatorColor: Qt.rgba(activeTextColor.r, activeTextColor.g, activeTextColor.b, 0.15)

    // Toggle overlay visibility from C++ controller
    Connections {
        target: controller
        function onToggleRequested() {
            if (root.visible && root.active) {
                root.hide();
            } else {
                root.show();
                root.raise();
                root.requestActivate();
                inputField.forceActiveFocus();
            }
        }
    }

    // Escape shortcut to close the overlay
    Shortcut {
        sequence: "Escape"
        onActivated: root.hide()
    }

    // Background container with rounded corners and border
    Rectangle {
        id: bgContainer
        anchors.fill: parent
        radius: 12
        color: Qt.rgba(activeBgColor.r, activeBgColor.g, activeBgColor.b, appSettings.opacity)
        border.width: 1
        border.color: separatorColor
        clip: true

        StackLayout {
            id: mainLayout
            anchors.fill: parent
            anchors.margins: 16
            currentIndex: 0

            // Chat View Page
            ColumnLayout {
                spacing: 12

                // Input Area
                Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: Math.min(120, Math.max(48, inputField.implicitHeight + 12))
                    color: activeAltBgColor
                    radius: 8
                    border.width: 1
                    border.color: inputField.activeFocus ? activeFocusColor : separatorColor

                    RowLayout {
                        anchors.fill: parent
                        anchors.leftMargin: 8
                        anchors.rightMargin: 8
                        spacing: 8

                        ScrollView {
                            Layout.fillWidth: true
                            Layout.fillHeight: true
                            ScrollBar.vertical.policy: ScrollBar.AsNeeded

                            TextArea {
                                id: inputField
                                placeholderText: "Pergunte qualquer coisa..."
                                wrapMode: TextEdit.Wrap
                                color: activeTextColor
                                font.pointSize: 11
                                background: null
                                verticalAlignment: TextInput.AlignVCenter
                                leftPadding: 8
                                rightPadding: 8
                                topPadding: 10
                                bottomPadding: 10

                                Keys.onPressed: (event) => {
                                    if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter) {
                                        if (event.modifiers & Qt.ShiftModifier) {
                                            // Let Shift+Enter insert a newline
                                            event.accepted = false;
                                        } else {
                                            event.accepted = true;
                                            sendCurrentMessage();
                                        }
                                    }
                                }
                            }
                        }

                        Button {
                            icon.name: "media-playback-start"
                            flat: true
                            Layout.alignment: Qt.AlignVCenter
                            onClicked: sendCurrentMessage()
                            visible: inputField.text.trim().length > 0 && !openAIClient.isResponding
                        }

                        Button {
                            icon.name: "dialog-close"
                            flat: true
                            Layout.alignment: Qt.AlignVCenter
                            onClicked: openAIClient.cancelRequest()
                            visible: openAIClient.isResponding
                        }
                    }
                }

                // Divider line
                Rectangle {
                    Layout.fillWidth: true
                    height: 1
                    color: separatorColor
                }

                // Chat Responses Scrollable View
                ListView {
                    id: chatListView
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    model: openAIClient.chatHistory
                    spacing: 12
                    clip: true
                    boundsBehavior: Flickable.StopAtBounds

                    delegate: Item {
                        id: delegateItem
                        width: chatListView.width
                        implicitHeight: delegateColumn.implicitHeight + 12

                        ColumnLayout {
                            id: delegateColumn
                            anchors.left: parent.left
                            anchors.right: parent.right
                            anchors.leftMargin: 8
                            anchors.rightMargin: 8
                            spacing: 6

                            RowLayout {
                                spacing: 8

                                Kirigami.Icon {
                                    source: modelData.role === "user" ? "user-identity" : "brain"
                                    implicitWidth: 16
                                    implicitHeight: 16
                                    color: modelData.role === "user" ? activeHighlightColor : activeTextColor
                                }

                                Label {
                                    text: modelData.role === "user" ? "Você" : (modelData.isError ? "Erro" : "KAI")
                                    font.bold: true
                                    color: modelData.role === "user" ? activeHighlightColor : (modelData.isError ? activeNegativeTextColor : activeTextColor)
                                }
                            }

                            Rectangle {
                                Layout.fillWidth: true
                                radius: 8
                                color: modelData.role === "user" ? activeAltBgColor : "transparent"
                                border.width: modelData.role === "user" ? 1 : 0
                                border.color: separatorColor
                                implicitHeight: msgText.implicitHeight + (modelData.role === "user" ? 16 : 0)

                                TextArea {
                                    id: msgText
                                    anchors.fill: parent
                                    anchors.margins: modelData.role === "user" ? 8 : 0
                                    text: modelData.content
                                    readOnly: true
                                    selectByMouse: true
                                    wrapMode: TextEdit.Wrap
                                    textFormat: modelData.role === "user" ? Text.PlainText : Text.MarkdownText
                                    color: modelData.isError ? activeNegativeTextColor : activeTextColor
                                    background: null
                                    cursorVisible: false
                                    onLinkActivated: (link) => Qt.openUrlExternally(link)
                                }
                            }
                        }
                    }

                    // Auto-scroll on changes
                    Connections {
                        target: openAIClient
                        function onChatHistoryChanged() {
                            scrollTimer.start()
                        }
                        function onCurrentResponseChanged() {
                            scrollTimer.start()
                        }
                    }

                    Timer {
                        id: scrollTimer
                        interval: 50
                        repeat: false
                        onTriggered: chatListView.positionViewAtEnd()
                    }
                }

                // Thinking loading bar
                RowLayout {
                    Layout.fillWidth: true
                    Layout.leftMargin: 8
                    visible: openAIClient.isResponding && openAIClient.currentResponse.length === 0
                    spacing: 8

                    BusyIndicator {
                        implicitWidth: 16
                        implicitHeight: 16
                        running: parent.visible
                    }

                    Label {
                        text: "Pensando..."
                        font.italic: true
                        color: activeDisabledTextColor
                    }
                }

                // Action panel divider
                Rectangle {
                    Layout.fillWidth: true
                    height: 1
                    color: separatorColor
                }

                // Action Bar
                RowLayout {
                    Layout.fillWidth: true
                    spacing: 12

                    Button {
                        icon.name: "configure"
                        text: "Configurações"
                        flat: true
                        onClicked: mainLayout.currentIndex = 1
                    }

                    Item { Layout.fillWidth: true }

                    Button {
                        icon.name: "edit-copy"
                        text: "Copiar"
                        enabled: openAIClient.chatHistory.length > 0 && !openAIClient.isResponding
                        onClicked: {
                            for (var i = openAIClient.chatHistory.length - 1; i >= 0; --i) {
                                var msg = openAIClient.chatHistory[i];
                                if (msg.role === "assistant" && !msg.isError) {
                                    controller.copyToClipboard(msg.content);
                                    break;
                                }
                            }
                        }
                    }

                    Button {
                        icon.name: "edit-clear"
                        text: "Nova Conversa"
                        enabled: openAIClient.chatHistory.length > 0
                        onClicked: {
                            openAIClient.clearConversation();
                            inputField.text = "";
                            inputField.forceActiveFocus();
                        }
                    }

                    Button {
                        text: "Fechar"
                        onClicked: root.hide()
                    }
                }
            }

            // Settings View Page
            SettingsView {
                id: settingsView
            }
        }
    }

    // Helper functions
    function sendCurrentMessage() {
        var text = inputField.text.trim();
        if (text.length > 0 && !openAIClient.isResponding) {
            openAIClient.sendMessage(text);
            inputField.text = "";
        }
    }
}
