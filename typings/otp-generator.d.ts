interface OtpGenerateOptions {
    digits?: boolean,
    alphabets?: boolean,
    upperCase?: boolean,
    specialChars?: boolean
}

declare module 'otp-generator' {
    function generate(length: number, options?: OtpGenerateOptions): string;
}