<?php
require_once __DIR__ . '/config.php';

// Jika sudah login, langsung redirect ke dashboard
if (isset($_SESSION['user_id'])) {
    header("Location: dashboard.php");
    exit;
}

$error = '';
$info = '';
if (isset($_GET['expired'])) {
    $info = 'Sesi Anda telah berakhir. Silakan login kembali.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === '' || $password === '') {
        $error = 'Username dan password harus diisi.';
    } else {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id']  = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['nama']     = $user['nama'];
            $_SESSION['role']     = $user['role'];
            $_SESSION['last_activity'] = time();
            header("Location: dashboard.php");
            exit;
        } else {
            $error = 'Username atau password salah.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - <?= APP_NAME ?></title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body class="login-body">
    <div class="login-card">
        <div class="login-header">
            <div class="login-logo">
                <img src="https://iili.io/Cn2LE7a.png" alt="Logo SMPN 1 Bukit" onerror="this.outerHTML='🏫'">
            </div>
            <div>
                <h1>SMP Negeri 1 Bukit</h1>
                <p>Jln. Masjid Babussalam, Simpang Tiga, Redelong</p>
                <p style="font-size:0.8rem;opacity:0.85;margin-top:0.25rem"><?= APP_NAME ?></p>
            </div>
        </div>
        <form method="POST" class="login-form">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required autofocus>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            <?php if ($error): ?>
                <div class="alert alert-danger"><?= e($error) ?></div>
            <?php endif; ?>
            <?php if ($info): ?>
                <div class="alert alert-info"><?= e($info) ?></div>
            <?php endif; ?>
            <button type="submit" class="btn btn-primary btn-block">Masuk</button>
        </form>
    </div>
    <div style="text-align:center;font-size:0.75rem;color:#64748b;margin-top:1.5rem">© 2026 @EfKa Studio</div>
</body>
</html>
