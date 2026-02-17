<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= isset($pageTitle) ? htmlspecialchars($pageTitle) . ' – ' : '' ?><?= htmlspecialchars($config['coin_name'] ?? 'DDACOIN') ?> Explorer</title>
  <link rel="icon" href="favicon.ico" type="image/x-icon">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <a href="index.php" class="logo">
        <span class="logo-icon">◆</span>
        <span class="logo-text"><?= htmlspecialchars($config['coin_name'] ?? 'DDACOIN') ?> Explorer</span>
      </a>
      <nav class="nav-links">
        <a href="index.php" class="nav-link">Blocks</a>
      </nav>
    </div>
  </header>
  <main class="main-content">
