import { EventEmitter, Subscription, UnavailabilityError } from 'expo-modules-core';

import ExpoClipboard from './ExpoClipboard';

const emitter = new EventEmitter(ExpoClipboard);

const onClipboardEventName = 'onClipboardChanged';

type ClipboardEvent = {
  /**
   * The new content of the user's clipboard.
   */
  content: string;
};

export { Subscription, EventEmitter, ClipboardEvent };

/**
 * Gets the content of the user's clipboard. Please note that calling this method on web will prompt
 * the user to grant your app permission to "see text and images copied to the clipboard."
 *
 * @returns A promise that resolves to the content of the clipboard.
 */
export async function getStringAsync(): Promise<string> {
  if (!ExpoClipboard.getStringAsync) {
    throw new UnavailabilityError('Clipboard', 'getStringAsync');
  }
  return await ExpoClipboard.getStringAsync();
}

/**
 * Sets the content of the user's clipboard.
 *
 * @param text The string to save to the clipboard.
 *
 * @returns On web, this returns a boolean value indicating whether or not the string was saved to
 * the user's clipboard. On iOS and Android, nothing is returned.
 */
export function setString(text: string): void {
  if (!ExpoClipboard.setString) {
    throw new UnavailabilityError('Clipboard', 'setString');
  }
  return ExpoClipboard.setString(text);
}

/**
 * Gets the url from the user's clipboard.
 *
 * @returns A promise that fulfills to the url in the clipboard.
 * @platform iOS
 */
export async function getUrlAsync(): Promise<string | null> {
  if (!ExpoClipboard.getUrlAsync) {
    throw new UnavailabilityError('Clipboard', 'getUrlAsync');
  }
  return await ExpoClipboard.getUrlAsync();
}

/**
 * Sets a url in the user's clipboard.
 *
 * @param url The url to save to the clipboard.
 * @platform iOS
 */
export async function setUrlAsync(url: string): Promise<void> {
  if (!ExpoClipboard.setUrlAsync) {
    throw new UnavailabilityError('Clipboard', 'setUrlAsync');
  }
  return ExpoClipboard.setUrlAsync(url);
}

/**
 * Returns whether the clipboard has a URL content.
 *
 * @returns A promise that fulfills to `true` if clipboard has URL content, resolves to `false` otherwise.
 * @platform iOS
 */
export async function hasUrlAsync(): Promise<boolean> {
  if (!ExpoClipboard.hasUrlAsync) {
    throw new UnavailabilityError('Clipboard', 'hasUrlAsync');
  }
  return await ExpoClipboard.hasUrlAsync();
}

/**
 * Gets the image from the user's clipboard in the png format.
 *
 * @returns A promise that fulfills to base64 png image from the clipboard. You can use it
 * for example as the Image component source.
 * @platform iOS
 */
export async function getPngImageAsync(): Promise<string | null> {
  if (!ExpoClipboard.getPngImageAsync) {
    throw new UnavailabilityError('Clipboard', 'getPngImageAsync');
  }
  return await ExpoClipboard.getPngImageAsync();
}

/**
 * Gets the image from the user's clipboard in the jpg format.
 *
 * @returns A promise that resolves to base64 jpg image from the clipboard. You can use it
 * for example as the `Image` component source.
 * @platform iOS
 */
export async function getJpgImageAsync(): Promise<string | null> {
  if (!ExpoClipboard.getJpgImageAsync) {
    throw new UnavailabilityError('Clipboard', 'getJpgImageAsync');
  }
  return await ExpoClipboard.getJpgImageAsync();
}

/**
 * Sets an image in the user's clipboard.
 *
 * @param base64Image Image encoded as a base64 string, without mime type.
 * @platform iOS
 */
export async function setImageAsync(base64Image: string): Promise<void> {
  if (!ExpoClipboard.setImageAsync) {
    throw new UnavailabilityError('Clipboard', 'setImageAsync');
  }
  return ExpoClipboard.setImageAsync(base64Image);
}

/**
 * Returns whether the clipboard has a image content.
 *
 * @returns A promise that fulfills to `true` if clipboard has image content, resolves to `false` otherwise.
 * @platform iOS
 */
export async function hasImageAsync(): Promise<boolean> {
  if (!ExpoClipboard.hasImageAsync) {
    throw new UnavailabilityError('Clipboard', 'hasImageAsync');
  }
  return ExpoClipboard.hasImageAsync();
}

/**
 * Adds a listener that will fire whenever the content of the user's clipboard changes. This method
 * is a no-op on Web.
 *
 * @param listener Callback to execute when listener is triggered. The callback is provided a
 * single argument that is an object with a `content` key.
 *
 * @example
 * ```typescript
 * addClipboardListener(({ content }: ClipboardEvent) => {
 *   alert('Copy pasta! Here's the string that was copied: ' + content);
 * });
 * ```
 */
export function addClipboardListener(listener: (event: ClipboardEvent) => void): Subscription {
  return emitter.addListener<ClipboardEvent>(onClipboardEventName, listener);
}

/**
 * Removes the listener added by addClipboardListener. This method is a no-op on Web.
 *
 * @param subscription The subscription to remove (created by addClipboardListener).
 *
 * @example
 * ```typescript
 * const subscription = addClipboardListener(() => {
 *   alert('Copy pasta!');
 * });
 * removeClipboardListener(subscription);
 * ```
 */
export function removeClipboardListener(subscription: Subscription) {
  emitter.removeSubscription(subscription);
}
