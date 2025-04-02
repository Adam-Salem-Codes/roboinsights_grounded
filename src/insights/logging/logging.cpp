#include "insights/logging/logging.h"
#include <string.h>  // For string functions

namespace insights
{
    namespace logging
    {
        void writeToSDCard(const char *data)
        {
            // Create buffer for path to avoid modifying string literals
            char path[256];
            snprintf(path, sizeof(path), "/usd/%s", LOG_FILE_NAME);
            
            FILE *usd_file_write = fopen(path, "w");
            if (usd_file_write != nullptr) {
                fputs(data, usd_file_write);
                fclose(usd_file_write);
            }
        }

        void readFromSDCard(char *buffer, size_t buffer_size)
        {
            // Create buffer for path
            char path[256];
            snprintf(path, sizeof(path), "/usd/%s", LOG_FILE_NAME);
            
            FILE *usd_file_read = fopen(path, "r");
            if (usd_file_read == nullptr) {
                // Handle error - file couldn't be opened
                if (buffer_size > 0) {
                    buffer[0] = '\0'; // Empty string if file can't be opened
                }
                return;
            }
            
            // Read file content into buffer
            size_t bytes_read = fread(buffer, 1, buffer_size - 1, usd_file_read);
            
            // Ensure null termination
            if (buffer_size > 0) {
                buffer[bytes_read < buffer_size ? bytes_read : buffer_size - 1] = '\0';
            }
            
            fclose(usd_file_read);
        }

        void logJSON(const nlohmann::json &json_data)
        {
            // Convert JSON data to string
            std::string json_string = json_data.dump(4); // Pretty print with 4 spaces
            
            // Write JSON string to SD card
            writeToSDCard(json_string.c_str());
        }

        void readJSONFromSDCard(char *buffer, size_t buffer_size)
        {
            // Read file content into buffer
            readFromSDCard(buffer, buffer_size);
            
            // Parse JSON data from buffer
            try {
                nlohmann::json json_data = nlohmann::json::parse(buffer);
                
                // Format JSON and write back into the buffer (optional)
                std::string formatted = json_data.dump(4); // Pretty print with 4 spaces
                
                // Copy formatted JSON back to buffer if it fits
                if (formatted.length() < buffer_size) {
                    strcpy(buffer, formatted.c_str());
                }
            } catch (const nlohmann::json::parse_error &e) {
                // Handle JSON parsing error
                if (buffer_size > strlen(buffer) + 20) {
                    char error_msg[256];
                    snprintf(error_msg, sizeof(error_msg), "[JSON Error: %s]", e.what());
                    strcat(buffer, error_msg);
                }
            }
        }
    } // namespace logging
} // namespace insights