import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import org.kde.kirigami as Kirigami

Item {
    id: settingsRoot

    readonly property bool useSystemTheme: appSettings.theme === "system"
    readonly property bool forceDark: appSettings.theme === "dark"
    readonly property bool forceLight: appSettings.theme === "light"
    readonly property bool isDarkTheme: forceDark || (useSystemTheme && Kirigami.Theme.textColor.r > 0.5)

    readonly property color customTextColor: isDarkTheme ? "#eff0f1" : "#232425"
    readonly property color activeTextColor: useSystemTheme ? Kirigami.Theme.textColor : customTextColor
    readonly property color separatorColor: Qt.rgba(activeTextColor.r, activeTextColor.g, activeTextColor.b, 0.15)

    onVisibleChanged: {
        if (visible) {
            endpointField.text = appSettings.endpoint
            apiKeyField.text = appSettings.apiKey
            modelField.text = appSettings.model
            tempSlider.value = appSettings.temperature
            timeoutField.text = appSettings.timeout.toString()
            restoreSessionBox.checked = appSettings.restoreSession
            themeCombo.currentIndex = appSettings.theme === "light" ? 1 : (appSettings.theme === "dark" ? 2 : 0)
            opacitySlider.value = appSettings.opacity
        }
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 16

        Label {
            text: "Configurações KAI"
            font.pointSize: 14
            font.bold: true
            color: activeTextColor
            Layout.alignment: Qt.AlignHCenter
        }

        ScrollView {
            Layout.fillWidth: true
            Layout.fillHeight: true
            clip: true

            Kirigami.FormLayout {
                id: formLayout
                width: parent.width

                TextField {
                    id: endpointField
                    Kirigami.FormData.label: "Endpoint:"
                    placeholderText: "https://api.openai.com/v1"
                    Layout.fillWidth: true
                    text: appSettings.endpoint
                }

                TextField {
                    id: apiKeyField
                    Kirigami.FormData.label: "API Key:"
                    placeholderText: "Chave da API (se houver)"
                    echoMode: TextInput.Password
                    Layout.fillWidth: true
                    text: appSettings.apiKey
                }

                TextField {
                    id: modelField
                    Kirigami.FormData.label: "Modelo:"
                    placeholderText: "gpt-4o-mini"
                    Layout.fillWidth: true
                    text: appSettings.model
                }

                RowLayout {
                    Kirigami.FormData.label: "Temperatura:"
                    Layout.fillWidth: true
                    spacing: 12

                    Slider {
                        id: tempSlider
                        from: 0.0
                        to: 2.0
                        stepSize: 0.1
                        value: appSettings.temperature
                        Layout.fillWidth: true
                    }

                    Label {
                        text: tempSlider.value.toFixed(1)
                        color: activeTextColor
                        font.bold: true
                        Layout.preferredWidth: 30
                    }
                }

                TextField {
                    id: timeoutField
                    Kirigami.FormData.label: "Timeout (segundos):"
                    placeholderText: "30"
                    validator: IntValidator { bottom: 1; top: 300 }
                    Layout.fillWidth: true
                    text: appSettings.timeout.toString()
                }

                CheckBox {
                    id: restoreSessionBox
                    Kirigami.FormData.label: "Sessão:"
                    text: "Restaurar última conversa ao abrir"
                    checked: appSettings.restoreSession
                }

                ComboBox {
                    id: themeCombo
                    Kirigami.FormData.label: "Tema/Aparência:"
                    model: ["Automático (Tema do Sistema)", "Claro", "Escuro"]
                    Layout.fillWidth: true
                }

                RowLayout {
                    Kirigami.FormData.label: "Opacidade do Fundo:"
                    Layout.fillWidth: true
                    spacing: 12

                    Slider {
                        id: opacitySlider
                        from: 0.1
                        to: 1.0
                        stepSize: 0.05
                        Layout.fillWidth: true
                    }

                    Label {
                        text: (opacitySlider.value * 100).toFixed(0) + "%"
                        color: activeTextColor
                        font.bold: true
                        Layout.preferredWidth: 40
                    }
                }
            }
        }

        Rectangle {
            Layout.fillWidth: true
            height: 1
            color: separatorColor
        }

        RowLayout {
            Layout.fillWidth: true
            spacing: 12

            Button {
                text: "Sair do KAI"
                icon.name: "application-exit"
                onClicked: controller.quitApplication()
            }

            Item { Layout.fillWidth: true } // spacer

            Button {
                text: "Cancelar"
                icon.name: "dialog-cancel"
                flat: true
                onClicked: {
                    appSettings.load()
                    mainLayout.currentIndex = 0
                }
            }

            Button {
                text: "Salvar"
                icon.name: "document-save"
                highlighted: true
                onClicked: {
                    appSettings.endpoint = endpointField.text.trim()
                    appSettings.apiKey = apiKeyField.text.trim()
                    appSettings.model = modelField.text.trim()
                    appSettings.temperature = tempSlider.value
                    appSettings.timeout = parseInt(timeoutField.text) || 30
                    appSettings.restoreSession = restoreSessionBox.checked
                    appSettings.theme = themeCombo.currentIndex === 1 ? "light" : (themeCombo.currentIndex === 2 ? "dark" : "system")
                    appSettings.opacity = opacitySlider.value
                    appSettings.save()
                    mainLayout.currentIndex = 0
                }
            }
        }
    }
}
