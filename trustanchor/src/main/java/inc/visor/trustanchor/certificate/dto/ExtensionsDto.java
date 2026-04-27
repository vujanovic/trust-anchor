package inc.visor.trustanchor.certificate.dto;

import java.util.List;

public record ExtensionsDto(
    Boolean isCA,               // BasicConstraints
    Boolean keyCertSign,        // KeyUsage
    Boolean crlSign,
    Boolean digitalSignature,
    Boolean keyEncipherment,
    Boolean dataEncipherment,
    Boolean nonRepudiation,
    List<String> extendedKeyUsages  // ["serverAuth", "clientAuth", "emailProtection", "codeSigning"]
) {}