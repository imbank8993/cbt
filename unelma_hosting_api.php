<?php
/**
 * Unelma File Uploader API
 * Simpan file ini di server Anda (unelma.id) dengan nama misalnya: api-upload.php
 * Pastikan folder 'uploads' atau folder target memiliki hak akses write (chmod 755/777).
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Konfigurasi direktori dasar penyimpanan
$baseDir = __DIR__ . '/uploads';
$baseUrl = 'https://unelma.id/storage';

// Bikin folder jika belum ada
if (!is_dir($baseDir)) {
    mkdir($baseDir, 0755, true);
}

$action = $_POST['action'] ?? '';

// === FUNGSI DELETE ===
if ($action === 'delete') {
    $fileUrl = $_POST['file_url'] ?? '';
    if ($fileUrl) {
        // Ambil path relatif dari URL
        $parsedUrl = parse_url($fileUrl);
        // Misal /unelma.id/uploads/avatars/file.jpg
        $path = $parsedUrl['path'];
        $pathParts = explode('/uploads/', $path);

        if (count($pathParts) == 2) {
            $relativePath = $pathParts[1];
            $absolutePath = $baseDir . '/' . $relativePath;

            // Hapus file fisik jika ada
            if (file_exists($absolutePath) && is_file($absolutePath)) {
                unlink($absolutePath);
                echo json_encode(['success' => true, 'message' => 'File deleted', 'path' => $absolutePath]);
                exit;
            } else {
                echo json_encode(['success' => false, 'message' => 'File not found on server']);
                exit;
            }
        }
    }
    echo json_encode(['success' => false, 'message' => 'Invalid file URL']);
    exit;
}

// === FUNGSI UPLOAD ===
if ($action === 'upload') {
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No file uploaded']);
        exit;
    }

    $file = $_FILES['file'];
    $folder = preg_replace('/[^a-zA-Z0-9_\-]/', '', $_POST['folder'] ?? 'misc');

    // Proses penghapusan file lama jika ada (timpa/ganti)
    $oldFileUrl = $_POST['old_file_url'] ?? '';
    if ($oldFileUrl) {
        $parsedUrl = parse_url($oldFileUrl);
        $pathParts = explode('/uploads/', $parsedUrl['path']);
        if (count($pathParts) == 2) {
            $oldAbsolutePath = $baseDir . '/' . $pathParts[1];
            if (file_exists($oldAbsolutePath) && is_file($oldAbsolutePath)) {
                unlink($oldAbsolutePath);
            }
        }
    }

    // Tentukan folder spesifik (misal avatars, questions)
    $targetDir = $baseDir . '/' . $folder;
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    // Nama file (gunakan nama asli tapi bersihkan karakternya, tambahkan unik ID agar aman)
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    // Validasi tipe file yang diperbolehkan
    $allowedExtensions = [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'svg',
        'bmp',  // Gambar
        'mp4',
        'webm',
        'avi',
        'mov',                          // Video
        'mp3',
        'wav',
        'ogg',                                   // Audio
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'ppt',
        'pptx',  // Dokumen
    ];

    if (!in_array($ext, $allowedExtensions)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Tipe file tidak diperbolehkan: .' . $ext]);
        exit;
    }

    // Batasan ukuran file (maks 10MB)
    $maxSize = 10 * 1024 * 1024; // 10MB
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ukuran file melebihi batas 10MB']);
        exit;
    }

    $filename = uniqid('file_') . '_' . time() . '.' . $ext;

    // Jika ada param 'filename' spesifik (misal untuk menimpa file yg sama persis)
    if (!empty($_POST['filename'])) {
        $filename = preg_replace('/[^a-zA-Z0-9_\-\.]/', '', $_POST['filename']) . '.' . $ext;
    }

    $targetFilePath = $targetDir . '/' . $filename;

    if (move_uploaded_file($file['tmp_name'], $targetFilePath)) {
        $finalUrl = $baseUrl . '/' . $folder . '/' . $filename;
        echo json_encode([
            'success' => true,
            'url' => $finalUrl,
            'message' => 'Upload berhasil'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Gagal memindahkan file yang diunggah']);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
exit;
