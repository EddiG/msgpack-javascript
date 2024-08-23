"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtData = void 0;
/**
 * ExtData is used to handle Extension Types that are not registered to ExtensionCodec.
 */
class ExtData {
    constructor(type, data, align = null) {
        this.type = type;
        this.data = data;
        this.align = align;
    }
}
exports.ExtData = ExtData;
//# sourceMappingURL=ExtData.js.map