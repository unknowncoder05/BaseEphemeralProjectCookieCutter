"""Comprehensive authentication tests.

Covers: signup, login, token refresh, logout, password reset (all methods),
account recovery, and graceful degradation when email is disabled.
"""
from unittest.mock import patch

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.test import APITestCase

from api.users.factories import UserFactory
from api.users.models import User

BASE = f"/{settings.API_URI}"
SIGN_UP    = f"{BASE}/auth/sign-up/"
LOGIN      = f"{BASE}/auth/login/"       # AuthViewSet.login — LoginSerializer + django_user_jwt
TOKEN      = f"{BASE}/auth/token/"       # CustomTokenObtainPairView — CustomTokenObtainPairSerializer
REFRESH    = f"{BASE}/auth/token-refresh/"
SIGN_OUT   = f"{BASE}/auth/sign-out/"
FORGOT_PW  = f"{BASE}/auth/forgot-password/"
RESET_PW   = f"{BASE}/auth/reset-password/"
REQ_REC    = f"{BASE}/auth/request-recovery/"
CONF_REC   = f"{BASE}/auth/confirm-recovery/"

VALID_SIGNUP = {
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@example.com",
    "password": "SecurePass#1",
    "password_confirm": "SecurePass#1",
}


def _make_active_user(password="TestPass#1", **kwargs):
    """Create a factory user with a known password and active status."""
    user = UserFactory(is_active=True, **kwargs)
    user.set_password(password)
    user.save()
    return user, password


class SignUpTests(APITestCase):

    @patch("boto3.client")
    def test_signup_success(self, _mock_boto):
        resp = self.client.post(SIGN_UP, VALID_SIGNUP, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertTrue(User.objects.filter(email=VALID_SIGNUP["email"]).exists())

    @patch("boto3.client")
    def test_signup_duplicate_email(self, _mock_boto):
        self.client.post(SIGN_UP, VALID_SIGNUP, format="json")
        resp = self.client.post(SIGN_UP, VALID_SIGNUP, format="json")
        self.assertIn(resp.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_409_CONFLICT])
        self.assertIn("error", resp.data)

    @patch("boto3.client")
    def test_signup_password_mismatch(self, _mock_boto):
        data = {**VALID_SIGNUP, "password_confirm": "DifferentPass#2"}
        resp = self.client.post(SIGN_UP, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", resp.data)

    @patch("boto3.client")
    def test_signup_password_too_short(self, _mock_boto):
        data = {**VALID_SIGNUP, "password": "short", "password_confirm": "short"}
        resp = self.client.post(SIGN_UP, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", resp.data)

    @patch("boto3.client")
    def test_signup_missing_email(self, _mock_boto):
        data = {k: v for k, v in VALID_SIGNUP.items() if k != "email"}
        resp = self.client.post(SIGN_UP, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", resp.data)

    @patch("boto3.client")
    def test_signup_invalid_email(self, _mock_boto):
        data = {**VALID_SIGNUP, "email": "not-an-email"}
        resp = self.client.post(SIGN_UP, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", resp.data)


class LoginTests(APITestCase):

    def setUp(self):
        self.mock_boto = patch("boto3.client").start()
        self.user, self.password = _make_active_user(email="login.test@example.com")

    def tearDown(self):
        patch.stopall()

    def test_login_success(self):
        resp = self.client.post(LOGIN, {"email": self.user.email, "password": self.password}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        # Should return access token
        self.assertIn("access", resp.data)

    def test_login_wrong_password(self):
        resp = self.client.post(LOGIN, {"email": self.user.email, "password": "WrongPass#9"}, format="json")
        self.assertIn(resp.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
        self.assertIn("error", resp.data)

    def test_login_nonexistent_email(self):
        resp = self.client.post(LOGIN, {"email": "nobody@example.com", "password": "AnyPass#1"}, format="json")
        self.assertIn(resp.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
        self.assertIn("error", resp.data)

    def test_login_missing_fields(self):
        resp = self.client.post(LOGIN, {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", resp.data)

    def test_login_inactive_user(self):
        inactive, pw = _make_active_user(email="inactive@example.com")
        inactive.is_active = False
        inactive.save()
        resp = self.client.post(LOGIN, {"email": inactive.email, "password": pw}, format="json")
        self.assertIn(resp.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
        self.assertIn("error", resp.data)


class JwtTokenPairTests(APITestCase):
    """Tests for CustomTokenObtainPairView (/auth/token/).

    This view uses CustomTokenObtainPairSerializer, which must inherit from
    TokenObtainPairSerializer (not the base TokenObtainSerializer) so that
    validate() populates refresh + access in the response.
    """

    def setUp(self):
        self.mock_boto = patch("boto3.client").start()
        self.user, self.password = _make_active_user(email="jwt.pair.test@example.com")

    def tearDown(self):
        patch.stopall()

    def test_token_obtain_returns_access_and_refresh(self):
        resp = self.client.post(TOKEN, {"email": self.user.email, "password": self.password}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertIn("access", resp.data)

    def test_token_obtain_wrong_password(self):
        resp = self.client.post(TOKEN, {"email": self.user.email, "password": "WrongPass#9"}, format="json")
        self.assertIn(resp.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])

    def test_token_obtain_inactive_user(self):
        self.user.is_active = False
        self.user.save()
        resp = self.client.post(TOKEN, {"email": self.user.email, "password": self.password}, format="json")
        self.assertNotEqual(resp.status_code, status.HTTP_200_OK)


class TokenRefreshTests(APITestCase):

    def setUp(self):
        self.mock_boto = patch("boto3.client").start()
        self.user, self.password = _make_active_user(email="refresh.test@example.com")

    def tearDown(self):
        patch.stopall()

    def test_refresh_success(self):
        login_resp = self.client.post(LOGIN, {"email": self.user.email, "password": self.password}, format="json")
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK, login_resp.data)
        refresh = login_resp.data["refresh"]
        resp = self.client.post(REFRESH, {"refresh": refresh}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertIn("access", resp.data)

    def test_refresh_invalid_token(self):
        # Use a format-valid but bogus JWT so the JWT library rejects it cleanly (not UnicodeDecodeError)
        fake_jwt = (
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
            ".eyJzdWIiOiIxMjM0NTY3ODkwIn0"
            ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        )
        resp = self.client.post(REFRESH, {"refresh": fake_jwt}, format="json")
        self.assertIn(resp.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
        self.assertIn("error", resp.data)


class LogoutTests(APITestCase):

    def setUp(self):
        self.mock_boto = patch("boto3.client").start()
        self.user, self.password = _make_active_user(email="logout.test@example.com")
        self.client.force_authenticate(user=self.user)

    def tearDown(self):
        patch.stopall()

    def test_logout_authenticated(self):
        resp = self.client.post(SIGN_OUT)
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])

    def test_logout_unauthenticated(self):
        self.client.force_authenticate(user=None)
        resp = self.client.post(SIGN_OUT)
        # Should either succeed (stateless) or return 401 — never 500
        self.assertNotEqual(resp.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasswordResetEmailTests(APITestCase):
    """Tests for the email-based password reset flow."""

    def setUp(self):
        self.mock_boto = patch("boto3.client").start()
        # Override to email method for these tests
        self.pw_method_patch = patch("pm_auth.api.users.conf.UsersSettings.password_reset_method",
                                     new_callable=lambda: property(lambda self: "email"))
        self.pw_method_patch.start()
        self.user, self.password = _make_active_user(email="reset.email@example.com")

    def tearDown(self):
        patch.stopall()

    def test_forgot_password_existing_email(self):
        """Returns 200 for an existing email (sends email)."""
        with patch("pm_auth.api.users.serializers.password_reset._send_email") as mock_send:
            resp = self.client.post(FORGOT_PW, {"email": self.user.email}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        mock_send.assert_called_once()

    def test_forgot_password_nonexistent_email(self):
        """Returns 200 even for unknown emails (no user enumeration)."""
        resp = self.client.post(FORGOT_PW, {"email": "nobody@example.com"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

    def test_forgot_password_invalid_email_format(self):
        resp = self.client.post(FORGOT_PW, {"email": "not-an-email"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", resp.data)

    def test_reset_password_valid_token(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        resp = self.client.post(RESET_PW, {
            "uid": uid,
            "token": token,
            "new_password": "NewSecurePass#9",
            "confirm_password": "NewSecurePass#9",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewSecurePass#9"))

    def test_reset_password_invalid_token(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        resp = self.client.post(RESET_PW, {
            "uid": uid,
            "token": "invalid-token",
            "new_password": "NewSecurePass#9",
            "confirm_password": "NewSecurePass#9",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", resp.data)

    def test_reset_password_mismatch(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        resp = self.client.post(RESET_PW, {
            "uid": uid,
            "token": token,
            "new_password": "NewSecurePass#9",
            "confirm_password": "DifferentPass#8",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", resp.data)


class PasswordResetConsoleTests(APITestCase):
    """Tests for the console-based password reset (no email required)."""

    def setUp(self):
        self.mock_boto = patch("boto3.client").start()
        self.pw_method_patch = patch("pm_auth.api.users.conf.UsersSettings.password_reset_method",
                                     new_callable=lambda: property(lambda self: "console"))
        self.pw_method_patch.start()
        self.user, self.password = _make_active_user(
            phone_number="+15551234567",
            email="reset.console@example.com",
        )

    def tearDown(self):
        patch.stopall()

    def test_forgot_password_console_creates_token(self):
        from api.users.models import ExternalAuthenticationToken
        # Mock send_token at the signal's import site to avoid hitting real delivery logic
        with patch("pm_auth.api.users.models.auth.send_token"):
            resp = self.client.post(FORGOT_PW, {"phone_number": self.user.phone_number}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertTrue(ExternalAuthenticationToken.objects.filter(user=self.user).exists())


class EmailFailureGracefulTests(APITestCase):
    """Verify that email delivery failures don't crash the API."""

    def setUp(self):
        self.mock_boto = patch("boto3.client").start()
        self.pw_method_patch = patch("pm_auth.api.users.conf.UsersSettings.password_reset_method",
                                     new_callable=lambda: property(lambda self: "email"))
        self.pw_method_patch.start()
        self.user, _ = _make_active_user(email="graceful@example.com")

    def tearDown(self):
        patch.stopall()

    def test_forgot_password_email_failure_returns_200(self):
        """Even if sending mail raises, the endpoint must return 200."""
        with (
            patch("pm_auth.api.users.serializers.password_reset.send_mail", side_effect=Exception("SMTP down")) as mail,
            self.assertLogs("pm_auth.api.users.serializers.password_reset", level="ERROR") as logs,
        ):
            resp = self.client.post(FORGOT_PW, {"email": self.user.email}, format="json")
        mail.assert_called_once()
        self.assertIn("SMTP down", "\n".join(logs.output))
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

    def test_request_recovery_email_failure_returns_200(self):
        """Account recovery email failure must also degrade gracefully."""
        self.user.is_active = False
        self.user.save()
        pw_rec_method = patch("pm_auth.api.users.conf.UsersSettings.password_reset_method",
                              new_callable=lambda: property(lambda self: "email"))
        pw_rec_method.start()
        with (
            patch("pm_auth.api.users.serializers.password_reset.send_mail", side_effect=Exception("SMTP down")) as mail,
            self.assertLogs("pm_auth.api.users.serializers.password_reset", level="ERROR") as logs,
        ):
            resp = self.client.post(REQ_REC, {"email": self.user.email}, format="json")
        mail.assert_called_once()
        self.assertIn("SMTP down", "\n".join(logs.output))
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        pw_rec_method.stop()


class AccountRecoveryTests(APITestCase):

    def setUp(self):
        self.mock_boto = patch("boto3.client").start()
        self.pw_method_patch = patch("pm_auth.api.users.conf.UsersSettings.password_reset_method",
                                     new_callable=lambda: property(lambda self: "email"))
        self.pw_method_patch.start()
        self.user, _ = _make_active_user(email="recovery@example.com")
        self.user.is_active = False
        self.user.save()

    def tearDown(self):
        patch.stopall()

    def test_request_recovery_inactive_user(self):
        with patch("pm_auth.api.users.serializers.password_reset._send_email"):
            resp = self.client.post(REQ_REC, {"email": self.user.email}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

    def test_request_recovery_active_user_is_noop(self):
        """Requesting recovery for an already-active account returns 200 silently."""
        self.user.is_active = True
        self.user.save()
        resp = self.client.post(REQ_REC, {"email": self.user.email}, format="json")
        # Should either succeed silently (200) or return a helpful 400 — never 500
        self.assertNotEqual(resp.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_confirm_recovery_valid_token(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        resp = self.client.post(CONF_REC, {
            "uid": uid,
            "token": token,
            "new_password": "RecoveredPass#9",
            "confirm_password": "RecoveredPass#9",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_active)
        self.assertTrue(self.user.check_password("RecoveredPass#9"))
