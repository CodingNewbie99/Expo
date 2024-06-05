import * as React from 'react';
import { GestureResponderEvent } from 'react-native';
import { LinkToOptions } from '../../types/expo-router';
export default function useLinkToPathProps(props: {
    href: string;
    event?: string;
    options?: LinkToOptions;
}): {
    href: string;
    role: "link";
    onPress: (e?: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent) => void;
};
//# sourceMappingURL=useLinkToPathProps.d.ts.map