/**
 * ExtData is used to handle Extension Types that are not registered to ExtensionCodec.
 */
var ExtData = /** @class */ (function () {
    function ExtData(type, data, align) {
        if (align === void 0) { align = null; }
        this.type = type;
        this.data = data;
        this.align = align;
    }
    return ExtData;
}());
export { ExtData };
//# sourceMappingURL=ExtData.mjs.map