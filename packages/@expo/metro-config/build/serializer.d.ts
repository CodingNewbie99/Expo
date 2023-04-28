import type { Graph, Module, SerializerOptions } from 'metro';
import { ConfigT, InputConfigT } from 'metro-config';
import { SerialAsset } from './getCssDeps';
type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;
type SerializerParameters = Parameters<Serializer>;
type SerialProcessor = (...props: SerializerParameters) => SerializerParameters;
export declare function replaceEnvironmentVariables(code: string, env: Record<string, string | undefined>): string;
export declare function getTransformEnvironment(url: string): string | null;
export declare function serializeWithEnvironmentVariables(entryPoint: string, preModules: readonly Module[], graph: Graph, options: SerializerOptions): SerializerParameters;
export declare function withExpoSerializers(config: InputConfigT): InputConfigT;
export declare function withSerialProcessors(config: InputConfigT, processors: SerialProcessor[]): InputConfigT;
export declare function createSerializerFromSerialProcessors(processors: (SerialProcessor | undefined)[], serializer?: Serializer): Serializer;
export declare function writeSerialAssets(assets: SerialAsset[], { outputDir }: {
    outputDir: string;
}): void;
export declare function htmlFromSerialAssets(assets: SerialAsset[], { dev, template, bundleUrl }: {
    dev: boolean;
    template: string;
    bundleUrl?: string;
}): string;
export declare function appendLinkToHtml(html: string, links: {
    rel: string;
    href: string;
    as?: string;
}[]): string;
export { SerialAsset };
