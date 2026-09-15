import type { Uploads as UploadsClient } from '../generated/Uploads';

export function createUploadsService(client: UploadsClient) {
  return {
    uploadImage: async (file: File): Promise<string> => {
      const res = await client.uploadsControllerUploadImage({ file });
      if (!res.url) throw new Error('圖片上傳失敗');
      return res.url;
    },
  };
}
