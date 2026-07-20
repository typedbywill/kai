cmake_minimum_required(VERSION 3.16)

project(kai VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)

# Find Extra CMake Modules (standard for KDE apps)
find_package(ECM REQUIRED NO_MODULE)
set(CMAKE_MODULE_PATH ${ECM_MODULE_PATH})

# Find Qt6 components
find_package(Qt6 REQUIRED COMPONENTS Core Gui Qml Quick Network)

# Find KF6 components
find_package(KF6 REQUIRED COMPONENTS Kirigami GlobalAccel)
find_package(KF6WindowSystem)

# Source files
add_executable(kai
    src/main.cpp
    src/api/OpenAIClient.cpp
    src/api/OpenAIClient.h
    src/config/Settings.cpp
    src/config/Settings.h
    src/KAIController.cpp
    src/KAIController.h
    src/resources.qrc
)

target_link_libraries(kai PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Qml
    Qt6::Quick
    Qt6::Network
    KF6::Kirigami
    KF6::GlobalAccel
)

if(KF6WindowSystem_FOUND)
    target_link_libraries(kai PRIVATE KF6::WindowSystem)
    target_compile_definitions(kai PRIVATE HAVE_KWINDOWSYSTEM)
endif()

install(TARGETS kai DESTINATION bin)
