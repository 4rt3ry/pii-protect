from time import perf_counter
import server
import asyncio
import totp

class PublicKeyPayload():
    public_key: str

class TotpPayload():
    phone: str
    totp: str

class VerifyPIIPayload():
    ciphertext: str
    iv: str

class MockResponse():
    def set_cookie(self, **args):
        pass

class MockSession():
    session_key: str


async def benchmark(fn, *args):

    start = perf_counter()
    res = await fn(*args)
    end = perf_counter()

    print("  Time:", end - start, "ms")

async def main():

    mock_response = MockResponse()
    mock_session = MockSession()
    mock_session.session_key = "1234"

    print()
    print()
    print()

    """ test key transfer """
    print("Testing /post_public_key")

    public_key_payload = PublicKeyPayload()
    public_key_payload.public_key = "-----BEGIN PUBLIC KEY-----\nMHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEJjkLa9Hic2U+u/dpD+ckWCjal1ZeGFqO\nNyh299RryALi863H    P8EWbSvAYa9f+ubDz8xQk9ts3AX4DAKwzSg+fY2aO3i+8mdN\nrwoqJ9ysECcUhcF86wqXxrwXralsMMzf\n-----END PUBLIC KEY-----\n"

    await benchmark(server.post_key_half, {}, mock_response,  public_key_payload)
    # start = perf_counter()
    # res = await server.post_key_half({}, mock_response,  public_key_payload)
    # end = perf_counter()

    # print("  Time:", end - start)

    """ test totp """

    print()
    print("Testing /verify_totp")

    totp_payload = TotpPayload()
    totp_payload.phone = "+15855550123"

    session_id = list(server.session_backend.data.keys())[0]
    mock_session = server.session_backend.data[session_id]
    
    totp_payload.totp = totp.get_totp_token(totp.get_totp_secret(totp_payload.phone))

    await benchmark(server.verify_totp, {}, totp_payload, mock_session, session_id)


    """ test verify_pii """

    print()
    print("Testing /verify_pii")
    pii_paylaod = VerifyPIIPayload()

    pii_paylaod.ciphertext = "itJmaAEKpXVU/UxCKvN6WOKPM5nmxgnDlPU+100Z8xOhQZTdmxH/Hh0EfbWvJo815+3wtx/oLyghfi1g6vLsjKiRh3y+aSK0bShVqWN+iv0pt6mDH5TCR419MavVIdGDJMjZdxkC+0BWvcDrdzQ7uYwUiYKTd3YJobJN7x5T5sZwN5TEzjlFfgxoPPL86X1T"
    pii_paylaod.iv = "z428OIy80VCimFAg"
    mock_session.session_key = "ZKIyoShMIID0CDGJVs2Tzka+up94DbxH0Zx4yu7sNio="

    await benchmark(server.verify_pii, {}, pii_paylaod, mock_session)

    print()
    print()
    print()


if __name__ == "__main__":
    asyncio.run(main())


