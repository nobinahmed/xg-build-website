<?php
/* Contact form handler: emails each enquiry to XG Build.
   Called by js/main.js with fetch(); also works as a plain form post
   (redirects back to the homepage) when JavaScript is off. */

const TO = 'enquiries@xgbuild.com.au';

$ajax = ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch';

function finish(bool $ok, string $message, bool $ajax): void {
  if ($ajax) {
    http_response_code($ok ? 200 : 400);
    header('Content-Type: application/json');
    echo json_encode(['ok' => $ok, 'message' => $message]);
  } else {
    header('Location: index.html?sent=' . ($ok ? '1' : '0') . '#contact');
  }
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Location: index.html#contact');
  exit;
}

// Honeypot: real visitors never see or fill this field.
if (!empty($_POST['website'])) finish(true, 'Thanks — we’ll be in touch soon.', $ajax);

// Strip line breaks from single-line fields so they can't inject mail headers.
$line = fn($v) => trim(preg_replace('/[\r\n]+/', ' ', (string) $v));

$name    = mb_substr($line($_POST['name'] ?? ''), 0, 120);
$phone   = mb_substr($line($_POST['phone'] ?? ''), 0, 40);
$email   = mb_substr($line($_POST['email'] ?? ''), 0, 200);
$message = mb_substr(trim((string) ($_POST['message'] ?? '')), 0, 5000);

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  finish(false, 'Please enter your name, a valid email address and a message.', $ajax);
}

$host = preg_replace('/^www\./', '', $_SERVER['SERVER_NAME'] ?? 'xgbuild.com.au');

$subject = '=?UTF-8?B?' . base64_encode("Website enquiry from $name") . '?=';
$body = "New enquiry from the XG Build website\n\n"
      . "Name:  $name\n"
      . "Phone: " . ($phone !== '' ? $phone : '—') . "\n"
      . "Email: $email\n\n"
      . "Message:\n$message\n";

$headers = implode("\r\n", [
  "From: XG Build Website <noreply@$host>",
  "Reply-To: $name <$email>",
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
]);

$sent = mail(TO, $subject, $body, $headers, "-fnoreply@$host");

finish(
  $sent,
  $sent ? 'Thanks — we’ll be in touch soon.' : 'Sorry, your message couldn’t be sent. Please call us on +61 424 204 690.',
  $ajax
);
