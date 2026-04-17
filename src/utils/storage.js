import AsyncStorage from '@react-native-async-storage/async-storage';

export async function lsGet(key) {
  try {
    const d = await AsyncStorage.getItem(key);
    return d ? JSON.parse(d) : null;
  } catch {
    return null;
  }
}

export async function lsSet(key, val) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(val));
  } catch {}
}
