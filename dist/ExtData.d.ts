/**
 * ExtData is used to handle Extension Types that are not registered to ExtensionCodec.
 */
export declare class ExtData {
    readonly type: number;
    readonly data: Uint8Array;
    readonly align: number | undefined | null;
    constructor(type: number, data: Uint8Array, align?: number | undefined | null);
}
