/* eslint-disable no-bitwise */
import { useMemo, useState } from 'react'
import { PermissionsAndroid, Platform } from 'react-native'

import * as ExpoDevice from 'expo-device'

import base64 from 'react-native-base64'
import { BleError, BleManager, Characteristic, Device } from 'react-native-ble-plx'

const DATA_SERVICE_UUID = '03B80E5A-EDE8-4B33-A751-6CE34EC4C700'
const COLOR_CHARACTERISTIC_UUID = '7772E5DB-3868-4112-A1A9-F2669D106BF3'

const bleManager = new BleManager()
window.base64 = base64

function useBLE() {
  const [allDevices, setAllDevices] = useState<Device[]>([])
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null)
  const [color, setColor] = useState('white')

  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, {
      title: 'Location Permission',
      message: 'Bluetooth Low Energy requires Location',
      buttonPositive: 'OK'
    })
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: 'Location Permission',
        message: 'Bluetooth Low Energy requires Location',
        buttonPositive: 'OK'
      }
    )
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'Bluetooth Low Energy requires Location',
        buttonPositive: 'OK'
      }
    )

    return (
      bluetoothScanPermission === 'granted' &&
      bluetoothConnectPermission === 'granted' &&
      fineLocationPermission === 'granted'
    )
  }

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
          title: 'Location Permission',
          message: 'Bluetooth Low Energy requires Location',
          buttonPositive: 'OK'
        })
        return granted === PermissionsAndroid.RESULTS.GRANTED
      } else {
        const isAndroid31PermissionsGranted = await requestAndroid31Permissions()

        return isAndroid31PermissionsGranted
      }
    } else {
      return true
    }
  }

  const connectToDevice = async (device: Device) => {
    try {
      console.log('Connecting to Device', device.name)
      const deviceConnection = await bleManager.connectToDevice(device.id)
      setConnectedDevice(deviceConnection)
      const characteristics = await deviceConnection.discoverAllServicesAndCharacteristics()

      console.log('Discovered Characteristics', characteristics)
      bleManager.stopDeviceScan()

      console.log('Connected to Device', device.name)

      startStreamingData(deviceConnection)
    } catch (e) {
      console.log('FAILED TO CONNECT', e)
    }
  }

  const isDuplicteDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex(device => nextDevice.id === device.id) > -1

  const scanForPeripherals = () =>
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error)
      }

      if (device && (device.localName?.includes('WIDI') || device.name?.includes('WIDI'))) {
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicteDevice(prevState, device)) {
            return [...prevState, device]
          }
          return prevState
        })
      } else if (device && device.localName?.includes('PuckCC') && device.name?.includes('PuckCC')) {
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicteDevice(prevState, device)) {
            return [...prevState, device]
          }
          return prevState
        })
      }
    })

  const onDataUpdate = (error: BleError | null, characteristic: Characteristic | null) => {
    console.log('Data Update', characteristic?.value)

    if (characteristic?.value === 'gICwGgA=') {
      console.log('Received from button')
    }
    if (error) {
      console.log(error)
      return
    } else if (!characteristic?.value) {
      console.log('No Data was received')
      return
    }

    const colorCode = base64.decode(characteristic.value)

    let color = 'white'
    if (colorCode === 'B') {
      color = 'blue'
    } else if (colorCode === 'R') {
      color = 'red'
    } else if (colorCode === 'G') {
      color = 'green'
    }

    setColor(color)
  }

  const startStreamingData = async (device: Device) => {
    if (device) {
      device.monitorCharacteristicForService(DATA_SERVICE_UUID, COLOR_CHARACTERISTIC_UUID, onDataUpdate)
    } else {
      console.log('No Device Connected')
    }
  }

  return {
    connectToDevice,
    allDevices,
    connectedDevice,
    color,
    requestPermissions,
    scanForPeripherals,
    startStreamingData
  }
}

export default useBLE
