import * as Bluetooth from 'expo-bluetooth';
// import {
//   Characteristics,
//   Descriptors,
//   JSONToNative,
//   nativeToJSON,
//   Services,
// } from 'expo-bluetooth-utils';
import { Platform } from 'expo-core';

const JSONToNative = () => {
  throw new Error('expo-bluetooth-utils is not ready.');
};
/**
 * TODO: Bacon
 * - test utils
 * - get all descriptors
 * - read a descriptor
 * - decode the value
 * - fix all android things
 * - unify and test errors
 * - fix android specific bugs
 * - test writing data somehow
 * - test android scan options
 */

function sleep(t) {
  return new Promise(r => setTimeout(r, t));
}

function getGATTNumbersFromID(id) {
  if (!id || id === '') {
    throw new Error('getGATTNumbersFromID(): Cannot get static data for null GATT number');
  }
  const [peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID] = id.split('|');
  return {
    peripheralUUID,
    serviceUUID,
    characteristicUUID,
    descriptorUUID,
  };
}

/*
function getStaticDataFromGATT({ id }) {
  if (!id || id === '') {
    throw new Error('getStaticDataFromGATT(): Cannot get static data for null GATT number');
  }
  const inputValues = [{}, Services, Characteristics, Descriptors];
  const components = id.split('|');
  const dataSet = inputValues[components.length - 1];
  return dataSet[components[components.length - 1]];
}

function getStaticInfoFromGATT(gatt) {
  const dataSet = getStaticDataFromGATT(gatt);
  let parsedValue = null;
  if (dataSet) {
    // TODO: Bacon: Add format to each data set item. Since this isn't done lets try converting every value to UTF-8

    if (gatt.value != null && dataSet.format === 'utf8') {
      parsedValue = nativeToJSON(gatt.value);
    }

    return {
      ...gatt,
      parsedValue,
      specForGATT: dataSet,
    };
  }
  return gatt;
}
*/
export const name = 'Bluetooth';

async function attemptQuickConnectionAsync(peripheralUUID, onDisconnect, timeout) {
  try {
    return await Bluetooth.connectAsync(peripheralUUID, { onDisconnect, timeout });
  } catch (error) {}
}

async function getConnectedPeripheralAsync(onDisconnect) {
  let attemptedConnections = [];
  return new Promise(async resolve => {
    let connected;
    const stopScanning = await Bluetooth.startScanningAsync(
      {
        androidOnlyConnectable: true,
      },
      async peripheral => {
        /* Named peripherals have a higher chance of interaction. For brevity let's use them. */
        if (Platform.OS === 'ios' && peripheral.name === 'BaconBook') {
          await stopScanning();
          const _connected = await attemptQuickConnectionAsync(peripheral.id, onDisconnect, 5000);
          resolve(peripheral);
          return;
        }
        if (
          !connected &&
          peripheral.name &&
          peripheral.name.length &&
          attemptedConnections.indexOf(peripheral.id) < 0
        ) {
          attemptedConnections.push(peripheral.id);
          console.log('getConnectedPeripheralAsync(): attempt to connect to ', peripheral.id);
          const _connected = await attemptQuickConnectionAsync(peripheral.id, onDisconnect, 3000);
          if (!connected && _connected) {
            connected = _connected;
            console.log(
              'getConnectedPeripheralAsync(): actually connected to: ',
              connected.id,
              connected.name
            );
            await stopScanning();

            let disconnectionRequests = [];
            for (const connection of attemptedConnections) {
              if (connection !== connected.id) {
                console.log('getConnectedPeripheralAsync(): Cancel losing: ', connection);
                disconnectionRequests.push(async () => Bluetooth.disconnectAsync(connection));
              }
            }
            await Promise.all(disconnectionRequests);

            resolve(peripheral);
          }
        }
      }
    );
  });
}

function scanForSinglePeripheral(options = { androidOnlyConnectable: true }) {
  return new Promise(async resolve => {
    const stopScanning = await Bluetooth.startScanningAsync(options, peripheral => {
      /* Named peripherals have a higher chance of interaction. For brevity let's use them. */
      if (peripheral.name && peripheral.name.length) {
        //   if (peripheral.name === 'LE-reserved') {
        stopScanning();
        resolve(peripheral);
      }
    });
  });
}

function validatePeripheral(peripheral, expect) {
  expect(peripheral).toBeDefined();
  expect(typeof peripheral.state).toBe('string');
  expect(Object.values(Bluetooth.PeripheralState).includes(peripheral.state)).toBe(true);
  expect(peripheral.advertisementData).toBeDefined();
}

export async function test({
  describe,
  xdescribe,
  it,
  xit,
  expect,
  afterEach,
  beforeEach,
  beforeAll,
  jasmine,
}) {
  await Bluetooth.requestPermissionAsync();

  const connected = await Bluetooth.getConnectedPeripheralsAsync();
  if (connected.length !== 0) {
    throw new Error('There should not be any connected peripherals at startup');
  }

  // return;
  async function clearAllConnections() {
    // let intervalID = setInterval(async () => {
    //   const connected = await Bluetooth.getConnectedPeripheralsAsync();
    //   console.log('- UPDATED', connected.length);
    // }, 1000);
    try {
      const connected = await Bluetooth.getConnectedPeripheralsAsync();
      console.log('=== LENGTH: ', connected.length);

      console.log(
        '=== RESULTS: ',
        await Promise.all(
          connected.map(async ({ id }) => {
            try {
              await Bluetooth.disconnectAsync(id);
              console.log('clearAllConnections(): disconnected: ', id);
            } catch (error) {
              console.log('==== FAILED STEP: ', id, error);
            }
          })
        )
      );

      const thenConnected = await Bluetooth.getConnectedPeripheralsAsync();
      if (thenConnected.length > 0) {
        console.log('=== BAD CLEAR ❌ ', thenConnected.map(({ id }) => id).join(', '));
      } else {
        console.log('=== SUCCESSFUL CLEAR ✅');
      }
    } catch (e) {
      console.log('=== FAILED TO CLEAR ❌ ', e.message);
    }
    // clearInterval(intervalID);
  }

  async function resetBLEStateAsync() {
    console.log('= Reset 🚩');
    console.log('== Stop Scan');
    await Bluetooth.stopScanningAsync();
    console.log('=== Scan Stopped ✅');
    console.log('== Clear Connections');
    await clearAllConnections();
    console.log('== Reset BLE');
    await Bluetooth._reset();
    console.log('=== BLE Reset! ⭐️');
  }

  let originalTimeout;
  const longerTimeout = 35000;

  beforeEach(async () => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = longerTimeout;
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  async function toThrowAsync(method) {
    try {
      await method();
      expect('Method').toBe('To Fail');
    } catch (error) {
      return error;
    }
  }

  function rejectsInvalidPeripheralUUID(method) {
    it(`rejects an invalid peripheral UUID`, async () => {
      const error = await toThrowAsync(method);
      if (error) {
        expect(error.code).toBe('ERR_BLE_INVALID_UUID');
        expect(error instanceof Bluetooth.BluetoothError).toBe(true);
      }
    });
  }

  async function logConnectedPeripheralsCountAsync() {
    const connected = await Bluetooth.getConnectedPeripheralsAsync();
    console.log('- still connected: ', connected.length);
  }

  describe('1. Scanning', () => {
    beforeEach(resetBLEStateAsync);

    describe('startScanAsync', () => {
      it(`throws an error when the device is already scanning.`, async () => {
        expect(await Bluetooth.isScanningAsync()).toBe(false);
        await Bluetooth.startScanningAsync({}, () => {});
        const error = await toThrowAsync(() => Bluetooth.startScanningAsync({}, () => {}));
        expect(error).toBeDefined();
        Bluetooth.stopScanningAsync();
      });

      xit('can stop scanning with the returned function.', async () => {
        let isScanning = await Bluetooth.isScanningAsync();
        expect(typeof isScanning).toBe('boolean');
        const stopScan = await Bluetooth.startScanningAsync({}, async () => {});
        expect(await Bluetooth.isScanningAsync()).toBe(true);
        await stopScan();
        expect(await Bluetooth.isScanningAsync()).toBe(false);
      });
    });

    return;
    describe('stopScanningAsync', () => {
      it(`correctly works with isScanningAsync()`, async () => {
        expect(await Bluetooth.isScanningAsync()).toBe(false);
        await Bluetooth.startScanningAsync({}, () => {});
        expect(await Bluetooth.isScanningAsync()).toBe(true);
        await Bluetooth.stopScanningAsync();
        expect(await Bluetooth.isScanningAsync()).toBe(false);
      });
    });
  });

  describe('2. Connecting', async () => {
    afterEach(resetBLEStateAsync);

    describe('disconnectAsync', () => {
      rejectsInvalidPeripheralUUID(Bluetooth.disconnectAsync);
    });

    describe('connectAsync()', () => {
      // rejectsInvalidPeripheralUUID(Bluetooth.connectAsync);
      let intervalID;

      beforeEach(async () => {
        intervalID = setInterval(() => logConnectedPeripheralsCountAsync(), 1000);
        await resetBLEStateAsync();
      });

      afterEach(async () => {
        clearInterval(intervalID);
      });

      it(`can discover and connect to a peripheral, then disconnect`, async () => {
        const connectedPeripheral = await getConnectedPeripheralAsync();
        validatePeripheral(connectedPeripheral, expect);
        console.log('Disconnect from peripheral: ', connectedPeripheral.id);
        await Bluetooth.disconnectAsync(connectedPeripheral.id);
      });

      it(`can discover, connect, and load a peripheral`, async () => {
        const connectedPeripheral = await getConnectedPeripheralAsync();
        validatePeripheral(connectedPeripheral, expect);
        const loaded = await Bluetooth.loadPeripheralAsync(connectedPeripheral, true);
        expect(loaded).toBeDefined();
      });

      it('calls onDisconnect', async () => {
        function connectThenDisconnect() {
          return new Promise(async (resolve, reject) => {
            try {
              const peripheral = await getConnectedPeripheralAsync(() => {
                resolve(true);
              });
              await Bluetooth.disconnectAsync(peripheral.id);
              console.log('Disconnected...');
              await sleep(20);
            } catch (error) {
              throw error;
            }
          });
        }
        expect(await connectThenDisconnect()).toBe(true);
      });

      // TODO: Bacon: This is hard on iOS because it can connect instantly. Maybe there is a way to clear caches.
      it('times out', async () => {
        const peripheral = await scanForSinglePeripheral();
        const { code } = await toThrowAsync(() =>
          Bluetooth.connectAsync(peripheral.id, { timeout: 1 })
        );
        expect(code).toBe('ERR_BLE_TIMEOUT');
      });
    });
  });

  describe('3. Retrieving', () => {
    beforeEach(resetBLEStateAsync);

    it('getPeripheralsAsync', async () => {
      const arr = await Bluetooth.getPeripheralsAsync();
      expect(Array.isArray(arr)).toBe(true);
      // expect(ExpoBluetooth.getPeripheralsAsync).toHaveBeenLastCalledWith();
    });
    it('getConnectedPeripheralsAsync', async () => {
      const arr = await Bluetooth.getConnectedPeripheralsAsync();
      expect(Array.isArray(arr)).toBe(true);
      // expect(ExpoBluetooth.getConnectedPeripheralsAsync).toHaveBeenLastCalledWith();
    });
    it('getCentralAsync', async () => {
      const central = await Bluetooth.getCentralAsync();
      expect(central).toBeDefined();
      expect(Object.values(Bluetooth.CentralState).includes(central.state)).toBe(true);
      // expect(ExpoBluetooth.getCentralAsync).toHaveBeenLastCalledWith();
    });
  });

  // TODO: Bacon: Doesn't work
  xdescribe('4. RSSI - readRSSIAsync()', () => {
    beforeEach(resetBLEStateAsync);

    rejectsInvalidPeripheralUUID(Bluetooth.readRSSIAsync);

    xit('fails if the peripheral is not connected.', async () => {
      const peripheral = await getConnectedPeripheralAsync();
      if (peripheral.state === Bluetooth.PeripheralState.Connected) {
        await Bluetooth.disconnectAsync(peripheral.id);
      }
      console.log('Run with disconnection: ', peripheral.id);
      const { message: errorMessage } = await toThrowAsync(() =>
        Bluetooth.readRSSIAsync(peripheral.id)
      );
      expect(errorMessage.includes('not connected')).toBe(true);
    });

    // TODO: Bacon: Broken on iOS - not ever calling the delegate method didReadRSSI
    it('can read an RSSI as expected.', async () => {
      const connectedPeripheral = await getConnectedPeripheralAsync();
      const RSSI = await Bluetooth.readRSSIAsync(connectedPeripheral.id);
      expect(RSSI).toBeDefined();
      expect(typeof RSSI).toBe('number');
    });
  });

  describe('5. Observing', () => {
    beforeEach(resetBLEStateAsync);

    describe('observeUpdates()', () => {
      it('will be called with all of the current peripheral data.', async () => {
        function getsUpdated() {
          return new Promise(async res => {
            const subscription = await Bluetooth.observeUpdates(({ peripherals }) => {
              console.log('BLE Screen: observeUpdatesAsync: ', peripherals);
              res(peripherals);
              subscription.remove();
            });
          });
        }

        const stopScanning = await Bluetooth.startScanningAsync({}, peripheral => {});
        expect(await getsUpdated()).toBeDefined();
        stopScanning();
      });
    });
    describe('observeCentralStateAsync()', () => {
      function getCentralManagerStateAsync() {
        return new Promise(async resolve => {
          const subscription = await Bluetooth.observeCentralStateAsync(state => {
            subscription.remove();
            resolve(state);
          });
        });
      }

      it(`get's the central manager state.`, async () => {
        const state = await getCentralManagerStateAsync();
        expect(Object.values(Bluetooth.CentralState).includes(state)).toBe(true);
      });
    });

    xdescribe('modify notifications', () => {
      // it('shouldNotifyDescriptorAsync', async () => {
      //     if (!isNotifying && properties.includes('notify')) {
      //       await Bluetooth.shouldNotifyDescriptorAsync({
      //         ...getGATTNumbersFromID(this.props.id),
      //         shouldNotify: true,
      //       });
      //     }
      // });
    });
  });

  describe('6. Discovery', () => {
    beforeEach(resetBLEStateAsync);

    describe('discoverServicesForPeripheralAsync()', async () => {
      it(`discovers, then connects to a peripheral, the peripheral then discovers it's services.`, async () => {
        const connectedPeripheral = await getConnectedPeripheralAsync();
        validatePeripheral(connectedPeripheral, expect);

        const {
          peripheral: { services },
        } = await Bluetooth.discoverServicesForPeripheralAsync({ id: connectedPeripheral.id });

        expect(Array.isArray(services)).toBe(true);

        // TODO: Bacon: Validate services
      });

      describe('discoverIncludedServicesForServiceAsync()', async () => {
        it(`discovers included services for a given service.`, async () => {
          const connectedPeripheral = await getConnectedPeripheralAsync();
          validatePeripheral(connectedPeripheral, expect);

          const {
            peripheral: { services },
          } = await Bluetooth.discoverServicesForPeripheralAsync({ id: connectedPeripheral.id });
          expect(Array.isArray(services)).toBe(true);
          expect(services.length > 0).toBe(true);
          if (services.length) {
            const {
              service: { includedServices },
            } = await Bluetooth.discoverIncludedServicesForServiceAsync({ id: services[0].id });

            expect(Array.isArray(includedServices)).toBe(true);
          }

          // TODO: Bacon: Validate services
        });
      });

      describe('discoverCharacteristicsForServiceAsync()', async () => {
        it(`discovers characteristics for a given service.`, async () => {
          const connectedPeripheral = await getConnectedPeripheralAsync();
          validatePeripheral(connectedPeripheral, expect);

          const {
            peripheral: { services },
          } = await Bluetooth.discoverServicesForPeripheralAsync({ id: connectedPeripheral.id });
          expect(Array.isArray(services)).toBe(true);
          expect(services.length > 0).toBe(true);
          if (services.length) {
            const {
              service: { characteristics },
            } = await Bluetooth.discoverCharacteristicsForServiceAsync({ id: services[0].id });

            expect(Array.isArray(characteristics)).toBe(true);
          }
        });

        describe('discoverDescriptorsForCharacteristicAsync()', async () => {
          it(`discovers descriptors for a given characteristic.`, async () => {
            const connectedPeripheral = await getConnectedPeripheralAsync();
            validatePeripheral(connectedPeripheral, expect);

            const {
              peripheral: { services },
            } = await Bluetooth.discoverServicesForPeripheralAsync({ id: connectedPeripheral.id });
            expect(Array.isArray(services)).toBe(true);
            expect(services.length > 0).toBe(true);
            if (services.length) {
              const {
                service: { characteristics },
              } = await Bluetooth.discoverCharacteristicsForServiceAsync({ id: services[0].id });

              expect(Array.isArray(characteristics)).toBe(true);
              expect(characteristics.length > 0).toBe(true);
              if (characteristics.length) {
                const {
                  characteristic: { descriptors },
                } = await Bluetooth.discoverDescriptorsForCharacteristicAsync({
                  id: characteristics[0].id,
                });
                expect(Array.isArray(descriptors)).toBe(true);
              }
            }
          });
        });
      });
    });
  });

  async function getLoadedPeripheralAsync() {
    const connectedPeripheral = await getConnectedPeripheralAsync();
    // validatePeripheral(connectedPeripheral, expect);
    return await Bluetooth.loadPeripheralAsync(connectedPeripheral, true);
  }
  function arrInAny(arr, arr2) {
    for (const v of arr2) {
      if (arr.includes(v)) {
        return true;
      }
    }
    return false;
  }

  function getCharacteristicsWithProperties(loadedPeripheral, properties) {
    const specialCharacteristics = [];
    for (const service of loadedPeripheral.services) {
      for (const characteristic of service.characteristics) {
        console.log('single', characteristic);
        if (arrInAny(characteristic.properties, properties)) {
          specialCharacteristics.push(characteristic);
        }
      }
    }
    return specialCharacteristics;
  }

  xdescribe('7. Writing', () => {
    // TODO: Bacon: This isn't complete
    xit('writeDescriptorAsync()', async () => {
      const loadedPeripheral = await getLoadedPeripheralAsync();
      validatePeripheral(loadedPeripheral, expect);

      // properties.includes('write');
      const characteristics = getCharacteristicsWithProperties(loadedPeripheral, ['write']);
      console.log({ characteristics });
      expect(!!characteristics.length).toBe(true);
      const targetCharacteristic = characteristics[0];

      // await Bluetooth.writeCharacteristicWithoutResponseAsync({
      //     ...getGATTNumbersFromID(targetCharacteristic.id),
      //     data: JSONToNative('bacon'),
      // });

      // await Bluetooth.writeDescriptorAsync({
      //   ...getGATTNumbersFromID(targetCharacteristic.descriptors[0].id),
      //   data: JSONToNative('bacon'),
      // });
    });

    describe('setNotifyCharacteristicAsync()', () => {
      it('can make a characteristic notifiable', async () => {
        const loadedPeripheral = await getLoadedPeripheralAsync();
        validatePeripheral(loadedPeripheral, expect);

        // properties.includes('write');
        const characteristics = getCharacteristicsWithProperties(loadedPeripheral, ['notify']);
        expect(!!characteristics.length).toBe(true);
        const targetCharacteristic = characteristics.filter(({ isNotifying }) => !isNotifying)[0];
        expect(targetCharacteristic.isNotifying).toBe(false);
        const modifiedCharacteristic = await Bluetooth.setNotifyCharacteristicAsync({
          ...getGATTNumbersFromID(targetCharacteristic.id),
          shouldNotify: true,
        });
        expect(modifiedCharacteristic.isNotifying).toBe(true);
        // TODO: Bacon: modifiedCharacteristic validation
        console.log({ modifiedCharacteristic });
      });
      // TODO: Bacon: iOS: The request is not supported.
      xit('writeCharacteristicAsync()', async () => {
        const loadedPeripheral = await getLoadedPeripheralAsync();
        validatePeripheral(loadedPeripheral, expect);

        // properties.includes('write');
        const characteristics = getCharacteristicsWithProperties(loadedPeripheral, ['write']);
        console.log({ characteristics });
        expect(!!characteristics.length).toBe(true);
        const targetCharacteristic = characteristics.filter(({ isNotifying }) => isNotifying)[0];

        // await Bluetooth.writeCharacteristicAsync({
        //   ...getGATTNumbersFromID(targetCharacteristic.id),
        //   data: JSONToNative('bacon'),
        // });
      });

      // TODO: Bacon: iOS: hard to test.
      xit('writeCharacteristicWithoutResponseAsync()', async () => {
        const loadedPeripheral = await getLoadedPeripheralAsync();
        validatePeripheral(loadedPeripheral, expect);

        // properties.includes('write');
        const characteristics = getCharacteristicsWithProperties(loadedPeripheral, [
          'writeWithoutResponse',
        ]);
        console.log({ characteristics });
        expect(!!characteristics.length).toBe(true);
        const targetCharacteristic = characteristics.filter(({ isNotifying }) => isNotifying)[0];

        // await Bluetooth.writeCharacteristicWithoutResponseAsync({
        //   ...getGATTNumbersFromID(targetCharacteristic.id),
        //   data: JSONToNative('bacon'),
        // });
      });
    });
  });

  if (Platform.OS === 'android') {
    describe('Android only', () => {
      beforeEach(resetBLEStateAsync);

      describe('requestConnectionPriorityAsync', () => {
        it(`works as expected`, async () => {
          const connectedPeripheral = await getConnectedPeripheralAsync();
          /// TODO: Bacon: No way to tell if it worked or not
          await Bluetooth.android.requestConnectionPriorityAsync(
            connectedPeripheral.id,
            Bluetooth.Priority.High
          );
        });
      });

      describe('requestMTUAsync', () => {
        it(`works as expected`, async () => {
          const connectedPeripheral = await getConnectedPeripheralAsync();
          await Bluetooth.android.requestMTUAsync(connectedPeripheral.id, 4);
        });
      });

      describe('bonding', () => {
        it(`bonds then unbonds`, async () => {
          const connectedPeripheral = await getConnectedPeripheralAsync();
          await Bluetooth.android.bondAsync(connectedPeripheral.id);
          await Bluetooth.android.unbondAsync(connectedPeripheral.id);
        });
      });

      describe('enableBluetoothAsync', () => {
        xit(`works as expected`, async () => {
          // Bluetooth.android.observeBluetoothAvailabilty(central => {})
          // await Bluetooth.android.enableBluetoothAsync(false);

          await Bluetooth.android.enableBluetoothAsync(true);
        });
      });

      describe('getBondedPeripheralsAsync', () => {
        it(`works as expected`, async () => {
          await Bluetooth.android.getBondedPeripheralsAsync();
        });
      });
    });
  }

  xdescribe('Errors', () => {
    // const error = Bluetooth._getGATTStatusError('ERR_BLE_GATT:' + 0x01);
    // console.log('Test Error', error.log());
  });
}

/**  
getStaticInfoFromGATT(this.props);

xdescribe('reading', async () => {
    it('readCharacteristicAsync', async () => {
    const someReadValue = await Bluetooth.readCharacteristicAsync(
      getGATTNumbersFromID(internalCharacteristicID)
    );
  });
  it('readDescriptorAsync', async () => {
    const someReadValue = await Bluetooth.readDescriptorAsync(
      getGATTNumbersFromID(internalDescriptorID)
    );
  });
});
*/
