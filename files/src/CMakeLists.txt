cmake_minimum_required(VERSION 3.5)
project(tn-test)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

find_package(ModLoader REQUIRED)

add_library(tn-test SHARED main.cpp)
target_link_libraries(tn-test PUBLIC ModLoader)
