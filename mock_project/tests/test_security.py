from core.security import validate_token

def test_security_valid():
    # Standard admin credentials
    assert validate_token("header.user:admin;scale:2.signature") is True

def test_security_guest():
    # Mismatched role validation
    assert validate_token("header.user:guest;scale:5.signature") is False

def test_security_zero_scale():
    # Dynamic zero division vector: triggers crash in core/security.py.
    # After a defensive patch, this should succeed and return True because role is 'admin'
    assert validate_token("header.user:admin;scale:0.signature") is True
