import Foundation

extension Data {
    var mimeType: String? {
        var bytes = [UInt8](repeating: 0, count: 8)
        self.copyBytes(to: &bytes, count: Swift.min(8, self.count))

        let patterns: [(bytes: [UInt8], mimeType: String)] = [
            ([0x89, 0x50, 0x4e, 0x47], "image/png"), // PNG
            ([0xff, 0xd8], "image/jpeg"), // JPEG
            ([0x47, 0x49, 0x46, 0x38], "image/gif"), // GIF
            // Add more patterns here if needed
        ]

        for pattern in patterns {
            if bytes.starts(with: pattern.bytes) {
                return pattern.mimeType
            }
        }

        return nil
    }
}
