import { PromptObject } from 'prompts';
/**
 * Possible command options.
 */
export declare type CommandOptions = {
    target: string;
    source?: string;
    withReadme: boolean;
    withChangelog: boolean;
    example: boolean;
};
/**
 * Represents an object that is passed to `ejs` when rendering the template.
 */
export declare type SubstitutionData = {
    project: {
        slug: string;
        name: string;
        version: string;
        description: string;
        package: string;
    };
    author: string;
    license: string;
    repo: string;
    reactNativeVersion: string;
};
export declare type CustomPromptObject = PromptObject & {
    name: string;
    resolvedValue?: string | null;
};
export declare type Answers = Record<string, string>;
