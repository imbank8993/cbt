/**
 * Helper untuk mengunggah dan menghapus file dari hosting external 
 * (unelma.id/api-upload.php)
 */

const API_URL = 'https://unelma.id/api-upload.php'; // Ganti jika struktur folder berubah

/**
 * Upload file ke hosting eksternal
 * @param file Objek file yang akan diunggah
 * @param folder Folder penyimpanan (cth: avatars, questions)
 * @param oldFileUrl (Opsional) URL file lama yg akan ditimpa/dihapus
 * @returns { success: boolean, url?: string, error?: string }
 */
export async function uploadToHosting(file: File, folder: string = 'misc', oldFileUrl: string = '') {
    try {
        const formData = new FormData();
        formData.append('action', 'upload');
        formData.append('file', file);
        formData.append('folder', folder);

        if (oldFileUrl) {
            formData.append('old_file_url', oldFileUrl);
        }

        const res = await fetch(API_URL, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            throw new Error(`Upload failed with status ${res.status}`);
        }

        const data = await res.json();
        if (data.success) {
            return { success: true, url: data.url };
        } else {
            return { success: false, error: data.message || 'Gagal mengupload' };
        }
    } catch (err: any) {
        console.error('Upload Error:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Hapus file dari hosting eksternal
 * @param fileUrl URL file yang akan dihapus
 */
export async function deleteFromHosting(fileUrl: string) {
    if (!fileUrl || !fileUrl.startsWith('http')) return { success: false };

    try {
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('file_url', fileUrl);

        const res = await fetch(API_URL, {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();
        return { success: data.success, message: data.message };
    } catch (err: any) {
        console.error('Delete Error:', err);
        return { success: false, error: err.message };
    }
}
