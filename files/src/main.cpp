#include <modloader/log.h>
using namespace modloader;

extern "C" void modloader_on_server_start(void* serverInstance) {
  Log::verbose("TestMod", "Server has been started!");
}