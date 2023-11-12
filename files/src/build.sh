rm -r ./build
export CMAKE_PREFIX_PATH=./sdk
mkdir -p build && cd build
cmake ..
make