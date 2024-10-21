import React, { useState } from 'react'
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import DeviceModal from '../components/DeviceConnectionModal'
import useBLE from '../hooks/useBLE'
import base64 from 'react-native-base64'

const App = () => {
  const { allDevices, connectedDevice, connectToDevice, color, requestPermissions, scanForPeripherals } = useBLE()
  window.device = connectedDevice
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)

  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestPermissions()
    if (isPermissionsEnabled) {
      scanForPeripherals()
    }
  }

  const hideModal = () => {
    setIsModalVisible(false)
  }

  const openModal = async () => {
    setIsModalVisible(true)
    scanForDevices()
  }

  const sendMessage = (message: number[]) => {
    if (!connectedDevice) return

    connectedDevice.writeCharacteristicWithoutResponseForService(
      '03B80E5A-EDE8-4B33-A751-6CE34EC4C700',
      '7772E5DB-3868-4112-A1A9-F2669D106BF3',
      base64.encodeFromByteArray([0, 0, 176, ...message] as any)
    )
  }

  const nextPatch = () => {
    sendMessage([27, 127])
  }

  const previousPatch = () => {
    sendMessage([26, 0])
  }

  return (
    <SafeAreaView style={[styles.container]}>
      <View style={styles.heartRateTitleWrapper}>
        {connectedDevice ? (
          <>
            <Text style={styles.heartRateTitleText}>Connected</Text>
            <TouchableOpacity onPress={nextPatch} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Next Patch</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={previousPatch} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Previous Patch</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.heartRateTitleText}>Please connect the pedals</Text>
        )}
      </View>
      <TouchableOpacity onPress={openModal} style={styles.ctaButton}>
        <Text style={styles.ctaButtonText}>Connect</Text>
      </TouchableOpacity>
      <DeviceModal
        closeModal={hideModal}
        visible={isModalVisible}
        connectToPeripheral={connectToDevice}
        devices={allDevices}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000'
  },
  heartRateTitleWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  heartRateTitleText: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 20,
    color: 'black'
  },
  heartRateText: {
    fontSize: 25,
    marginTop: 15
  },
  ctaButton: {
    backgroundColor: '#FF6060',
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
    width: 200,
    marginBottom: 25,
    borderRadius: 8
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white'
  }
})

export default App
