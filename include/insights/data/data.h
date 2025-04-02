#ifndef INSIGHTS_DATA_H
#define INSIGHTS_DATA_H

#include <string>
#include <vector>
#include <unordered_map>
#include <memory>
#include <functional>
#include "pros/device.hpp"
#include "pros/motors.hpp"
#include "pros/imu.hpp"
#include "pros/adi.hpp"
#include "pros/gps.hpp"
#include "pros/distance.hpp"
#include "pros/optical.hpp"
#include "pros/rotation.hpp"
#include "pros/misc.hpp"

namespace insights {
namespace data {

// Forward declarations
class Device;
class Motor;
class IMU;
class ADIDigitalIn;
class ADIDigitalOut;
class ADIAnalogIn;
class Controller;
class GPS;
class Distance;
class Optical;
class Rotation;

// Base Device class
class Device {
public:
    virtual ~Device() = default;
    virtual std::string getType() const = 0;
    virtual int getPort() const = 0;
    virtual std::string getName() const = 0;
    virtual bool isConnected() const = 0;
};

// Specific device implementations
class Motor : public Device {
public:
    Motor(int port, const std::string& name = "");
    std::string getType() const override { return "Motor"; }
    int getPort() const override { return m_port; }
    std::string getName() const override { return m_name; }
    bool isConnected() const override;
    
    pros::Motor& getProsMotor() { return m_motor; }

private:
    int m_port;
    std::string m_name;
    pros::Motor m_motor;
};

class IMU : public Device {
public:
    IMU(int port, const std::string& name = "");
    std::string getType() const override { return "IMU"; }
    int getPort() const override { return m_port; }
    std::string getName() const override { return m_name; }
    bool isConnected() const override;
    
    pros::Imu& getProsIMU() { return m_imu; }

private:
    int m_port;
    std::string m_name;
    pros::Imu m_imu;
};

// Device Registry singleton
class DeviceRegistry {
public:
    static DeviceRegistry& getInstance();
    
    // Device registration methods
    std::shared_ptr<Motor> registerMotor(int port, const std::string& name = "");
    std::shared_ptr<IMU> registerIMU(int port, const std::string& name = "");
    std::shared_ptr<ADIDigitalIn> registerADIDigitalIn(int port, const std::string& name = "");
    std::shared_ptr<ADIDigitalOut> registerADIDigitalOut(int port, const std::string& name = "");
    std::shared_ptr<ADIAnalogIn> registerADIAnalogIn(int port, const std::string& name = "");
    std::shared_ptr<Controller> registerController(bool isPrimary = true, const std::string& name = "");
    std::shared_ptr<GPS> registerGPS(int port, const std::string& name = "");
    std::shared_ptr<Distance> registerDistance(int port, const std::string& name = "");
    std::shared_ptr<Optical> registerOptical(int port, const std::string& name = "");
    std::shared_ptr<Rotation> registerRotation(int port, const std::string& name = "");
    
    // Get devices
    std::vector<std::shared_ptr<Device>> getAllDevices() const;
    std::shared_ptr<Device> getDeviceByPort(int port) const;
    std::shared_ptr<Device> getDeviceByName(const std::string& name) const;
    
private:
    DeviceRegistry() = default;
    ~DeviceRegistry() = default;
    DeviceRegistry(const DeviceRegistry&) = delete;
    DeviceRegistry& operator=(const DeviceRegistry&) = delete;
    
    std::unordered_map<int, std::shared_ptr<Device>> m_devices;
    std::unordered_map<std::string, std::shared_ptr<Device>> m_devicesByName;
};

// Helper functions for cleaner API
inline std::shared_ptr<Motor> registerMotor(int port, const std::string& name = "") {
    return DeviceRegistry::getInstance().registerMotor(port, name);
}

inline std::shared_ptr<IMU> registerIMU(int port, const std::string& name = "") {
    return DeviceRegistry::getInstance().registerIMU(port, name);
}

inline std::shared_ptr<ADIDigitalIn> registerADIDigitalIn(int port, const std::string& name = "") {
    return DeviceRegistry::getInstance().registerADIDigitalIn(port, name);
}

inline std::shared_ptr<ADIDigitalOut> registerADIDigitalOut(int port, const std::string& name = "") {
    return DeviceRegistry::getInstance().registerADIDigitalOut(port, name);
}

inline std::shared_ptr<ADIAnalogIn> registerADIAnalogIn(int port, const std::string& name = "") {
    return DeviceRegistry::getInstance().registerADIAnalogIn(port, name);
}

inline std::shared_ptr<Controller> registerController(bool isPrimary = true, const std::string& name = "") {
    return DeviceRegistry::getInstance().registerController(isPrimary, name);
}

inline std::shared_ptr<GPS> registerGPS(int port, const std::string& name = "") {
    return DeviceRegistry::getInstance().registerGPS(port, name);
}

inline std::shared_ptr<Distance> registerDistance(int port, const std::string& name = "") {
    return DeviceRegistry::getInstance().registerDistance(port, name);
}

inline std::shared_ptr<Optical> registerOptical(int port, const std::string& name = "") {
    return DeviceRegistry::getInstance().registerOptical(port, name);
}

inline std::shared_ptr<Rotation> registerRotation(int port, const std::string& name = "") {
    return DeviceRegistry::getInstance().registerRotation(port, name);
}

} // namespace data
} // namespace insights

#endif // INSIGHTS_DATA_H