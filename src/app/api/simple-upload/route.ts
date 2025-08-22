import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readdir, stat, unlink, readFile } from "fs/promises";
import path from "path";

// Configuration for Next.js static export
export const dynamic = 'force-dynamic';
export const revalidate = false;

console.log("🔥 SIMPLE UPLOAD ROUTE LOADED:", new Date().toISOString());

// Define the upload directory - this will be in the public folder so images can be served
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'patients');

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating upload directory:", error);
  }
}

export async function POST(request: NextRequest) {
  console.log(`🔄 [SIMPLE-UPLOAD] POST called - ${new Date().toISOString()}`);
  
  try {
    // Ensure upload directory exists
    await ensureUploadDir();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const patientId = formData.get('patient_id') as string;
    
    console.log(`🔄 [SIMPLE-UPLOAD] Patient ID: ${patientId}, File: ${file?.name}`);
    
    if (!file) {
      console.error("❌ [SIMPLE-UPLOAD] No file provided");
      return NextResponse.json({ 
        success: false,
        error: "No file provided" 
      }, { status: 400 });
    }
    
    if (!patientId) {
      console.error("❌ [SIMPLE-UPLOAD] No patient ID provided");
      return NextResponse.json({ 
        success: false,
        error: "No patient ID provided" 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      console.error(`❌ [SIMPLE-UPLOAD] Invalid file type: ${file.type}`);
      return NextResponse.json({ 
        success: false,
        error: "Only image files (JPG, PNG, GIF) are allowed" 
      }, { status: 400 });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error(`❌ [SIMPLE-UPLOAD] File too large: ${file.size} bytes`);
      return NextResponse.json({ 
        success: false,
        error: "File size must be less than 5MB" 
      }, { status: 400 });
    }

    console.log(`✅ [SIMPLE-UPLOAD] File received: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    // Create patient-specific directory
    const patientDir = path.join(UPLOAD_DIR, patientId);
    await mkdir(patientDir, { recursive: true });

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const baseName = path.basename(file.name, fileExtension);
    const uniqueFileName = `${baseName}_${timestamp}${fileExtension}`;
    const filePath = path.join(patientDir, uniqueFileName);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log(`💾 [SIMPLE-UPLOAD] File saved to: ${filePath}`);

    // Create image data object
    const imageData = {
      id: timestamp,
      filename: uniqueFileName,
      original_name: file.name,
      size: file.size,
      type: file.type,
      upload_date: new Date().toISOString(),
      patient_id: patientId,
      url: `/uploads/patients/${patientId}/${uniqueFileName}`,
      file_path: filePath
    };

    console.log(`✅ [SIMPLE-UPLOAD] Upload successful for patient ${patientId}`);

    return NextResponse.json({
      success: true,
      data: imageData,
      message: "File uploaded successfully"
    });

  } catch (error) {
    console.error("❌ [SIMPLE-UPLOAD] Error during upload:", error);
    return NextResponse.json({ 
      success: false,
      error: "Internal server error during upload" 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log("🔍 [SIMPLE-UPLOAD] GET called");
  
  try {
    // Get patient_id from query parameters
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');
    
    console.log(`🔍 [SIMPLE-UPLOAD] Getting images for patient: ${patientId}`);
    
    if (!patientId) {
      console.log("❌ [SIMPLE-UPLOAD] Missing patient_id parameter");
      return NextResponse.json({
        success: false,
        error: "Patient ID is required"
      }, { status: 400 });
    }

    // Ensure base upload directory exists
    try {
      await ensureUploadDir();
    } catch (dirError) {
      console.error("❌ [SIMPLE-UPLOAD] Error creating upload directory:", dirError);
      return NextResponse.json({
        success: false,
        error: "Error creating upload directory"
      }, { status: 500 });
    }

    // Read images from filesystem
    const patientDir = path.join(UPLOAD_DIR, patientId);
    let images: any[] = [];

    try {
      // Check if patient directory exists
      await stat(patientDir);
      
      // Read files in patient directory
      const files = await readdir(patientDir);
      
      // Create image objects for each file
      for (const filename of files) {
        try {
          // Skip comment files
          if (filename.endsWith('.comment.json')) {
            continue;
          }

          const filePath = path.join(patientDir, filename);
          const fileStats = await stat(filePath);
          
          // Extract original name and timestamp from filename
          const parts = filename.split('_');
          const timestampPart = parts[parts.length - 1].split('.')[0];
          const originalName = filename.replace(`_${timestampPart}`, '');
          
          // Try to read comment file for this image
          let comment = "";
          try {
            const commentPath = path.join(patientDir, `${filename}.comment.json`);
            const commentData = await readFile(commentPath, 'utf-8');
            const commentJson = JSON.parse(commentData);
            comment = commentJson.comment || "";
          } catch (error) {
            // No comment file exists, that's okay
          }
          
          const imageData = {
            id: parseInt(timestampPart) || Date.now(),
            filename: filename,
            original_name: originalName,
            size: fileStats.size,
            type: `image/${path.extname(filename).slice(1)}`,
            upload_date: new Date(fileStats.mtime).toISOString(),
            patient_id: patientId,
            url: `/uploads/patients/${patientId}/${filename}`,
            file_path: filePath,
            comment: comment
          };
          
          images.push(imageData);
        } catch (fileError) {
          console.error(`❌ [SIMPLE-UPLOAD] Error processing file ${filename}:`, fileError);
          // Continue with other files
        }
      }
      
    } catch (error) {
      // Directory doesn't exist or is empty - that's fine
      console.log(`📁 [SIMPLE-UPLOAD] No images directory for patient ${patientId} or directory is empty`);
      // Return empty array, not an error
    }

    console.log(`✅ [SIMPLE-UPLOAD] Returning ${images.length} images for patient ${patientId}`);
    
    return NextResponse.json({
      success: true,
      data: images,
      message: `Found ${images.length} images for patient ${patientId}`
    });

  } catch (error) {
    console.error("❌ [SIMPLE-UPLOAD] Error reading images:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json({ 
      success: false,
      error: "Error reading images",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  console.log(`🗑️ [SIMPLE-UPLOAD] DELETE called - ${new Date().toISOString()}`);
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patient_id');
    const imageName = searchParams.get('image');

    if (!patientId || !imageName) {
      console.log("❌ [SIMPLE-UPLOAD] Missing patient_id or image parameter");
      return NextResponse.json({ 
        success: false,
        error: "Missing patient_id or image parameter" 
      }, { status: 400 });
    }

    console.log(`🗑️ [SIMPLE-UPLOAD] Deleting image: ${imageName} for patient: ${patientId}`);

    // Construct the full path to the image
    const patientDir = path.join(UPLOAD_DIR, patientId);
    const imagePath = path.join(patientDir, imageName);

    // Security check: make sure the path is within the patient's directory
    const normalizedPatientDir = path.normalize(patientDir);
    const normalizedImagePath = path.normalize(imagePath);
    
    if (!normalizedImagePath.startsWith(normalizedPatientDir)) {
      console.log("❌ [SIMPLE-UPLOAD] Security violation: path outside patient directory");
      return NextResponse.json({ 
        success: false,
        error: "Invalid file path" 
      }, { status: 400 });
    }

    // Check if file exists and delete it
    try {
      await stat(imagePath);
      await unlink(imagePath);
      console.log(`✅ [SIMPLE-UPLOAD] Image deleted successfully: ${imagePath}`);
      
      // Also try to delete the comment file if it exists
      try {
        const commentPath = path.join(patientDir, `${imageName}.comment.json`);
        await unlink(commentPath);
        console.log(`✅ [SIMPLE-UPLOAD] Comment file deleted: ${commentPath}`);
      } catch (commentError) {
        // Comment file might not exist, that's okay
        console.log(`📝 [SIMPLE-UPLOAD] No comment file to delete for ${imageName}`);
      }
      
      return NextResponse.json({
        success: true,
        message: `Image ${imageName} deleted successfully`
      });
      
    } catch (fileError) {
      console.error("❌ [SIMPLE-UPLOAD] Error deleting image:", fileError);
      return NextResponse.json({ 
        success: false,
        error: "Image not found or could not be deleted" 
      }, { status: 404 });
    }

  } catch (error) {
    console.error("❌ [SIMPLE-UPLOAD] Error in DELETE operation:", error);
    return NextResponse.json({ 
      success: false,
      error: "Internal server error during deletion" 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  console.log(`📝 [SIMPLE-UPLOAD] PATCH called - ${new Date().toISOString()}`);
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patient_id');
    const imageName = searchParams.get('image');

    if (!patientId || !imageName) {
      console.log("❌ [SIMPLE-UPLOAD] Missing patient_id or image parameter");
      return NextResponse.json({ 
        success: false,
        error: "Missing patient_id or image parameter" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { comment } = body;

    console.log(`📝 [SIMPLE-UPLOAD] Updating comment for image: ${imageName}, patient: ${patientId}`);
    console.log(`📝 [SIMPLE-UPLOAD] New comment: "${comment}"`);

    // Construct the path to the comment file
    const patientDir = path.join(UPLOAD_DIR, patientId);
    const commentPath = path.join(patientDir, `${imageName}.comment.json`);

    // Security check: make sure the path is within the patient's directory
    const normalizedPatientDir = path.normalize(patientDir);
    const normalizedCommentPath = path.normalize(commentPath);
    
    if (!normalizedCommentPath.startsWith(normalizedPatientDir)) {
      console.log("❌ [SIMPLE-UPLOAD] Security violation: path outside patient directory");
      return NextResponse.json({ 
        success: false,
        error: "Invalid file path" 
      }, { status: 400 });
    }

    // Ensure patient directory exists
    await mkdir(patientDir, { recursive: true });

    // Save comment to JSON file
    const commentData = {
      image: imageName,
      comment: comment || "",
      updated_at: new Date().toISOString()
    };

    await writeFile(commentPath, JSON.stringify(commentData, null, 2), 'utf-8');
    console.log(`✅ [SIMPLE-UPLOAD] Comment saved to: ${commentPath}`);
    
    return NextResponse.json({
      success: true,
      message: `Comment updated for image ${imageName}`
    });

  } catch (error) {
    console.error("❌ [SIMPLE-UPLOAD] Error updating comment:", error);
    return NextResponse.json({ 
      success: false,
      error: "Error updating comment" 
    }, { status: 500 });
  }
}
