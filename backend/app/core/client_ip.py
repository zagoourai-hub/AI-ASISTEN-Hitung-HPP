from ipaddress import IPv4Address, IPv4Network, IPv6Address, IPv6Network, ip_address, ip_network

from fastapi import Request

from app.core.config import Settings

IpAddress = IPv4Address | IPv6Address
IpNetwork = IPv4Network | IPv6Network


def _parse_ip(raw: str) -> IpAddress | None:
    try:
        parsed = ip_address(raw.strip())
    except ValueError:
        return None
    if isinstance(parsed, IPv6Address) and parsed.ipv4_mapped is not None:
        return parsed.ipv4_mapped
    return parsed


def _is_trusted(address: IpAddress, networks: list[IpNetwork]) -> bool:
    return any(address.version == network.version and address in network for network in networks)


def _forwarded_for_client(header: str, networks: list[IpNetwork]) -> IpAddress | None:
    # Walk right-to-left: the right-most untrusted hop is the last address a trusted proxy
    # observed itself, so anything further left is attacker-controlled and ignored.
    for part in reversed(header.split(",")):
        candidate = _parse_ip(part)
        if candidate is None:
            return None
        if not _is_trusted(candidate, networks):
            return candidate
    return None


def resolve_client_ip(request: Request, settings: Settings) -> str:
    peer_host = request.client.host if request.client is not None else "unknown"
    peer = _parse_ip(peer_host)
    if peer is None or not settings.trusted_proxy_cidrs:
        return peer_host

    networks = [ip_network(cidr, strict=False) for cidr in settings.trusted_proxy_cidrs]
    if not _is_trusted(peer, networks):
        return str(peer)

    header = request.headers.get(settings.client_ip_header)
    if header is None:
        return str(peer)
    if settings.client_ip_header == "x-forwarded-for":
        client = _forwarded_for_client(header, networks)
    else:
        client = _parse_ip(header)
    return str(client) if client is not None else str(peer)


def rate_limit_identity(client_ip: str) -> str:
    """Collapse IPv6 to its /64 so rotating addresses inside one allocation share a bucket."""
    parsed = _parse_ip(client_ip)
    if isinstance(parsed, IPv6Address):
        return str(IPv6Network(f"{parsed}/64", strict=False).network_address)
    return client_ip
