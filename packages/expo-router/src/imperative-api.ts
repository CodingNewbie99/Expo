import { store } from './global-state/router-store';
import { ExpoRouter } from '../types/expo-router';

export const router: ExpoRouter.Router = {
  navigate: (href, options) => store.navigate(href, options),
  push: (href, options) => store.push(href, options),
  dismiss: (count) => store.dismiss(count),
  dismissAll: () => store.dismissAll(),
  canDismiss: () => store.canDismiss(),
  replace: (href, options) => store.replace(href, options),
  back: () => store.goBack(),
  canGoBack: () => store.canGoBack(),
  setParams: (params) => store.setParams(params),
};
