import { Router } from "express";
import { getUserProfile, loginUser, registerUser, updateUserProfile } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router=Router();
router.post("/register",upload.single("image"),registerUser)
router.post("/login",loginUser)
router.get("/profile",protect,getUserProfile);
router.put("/profile",upload.single("image"),protect,updateUserProfile);


router.post("/upload-image",protect,upload.single("image"), (req, res) => {
    if(!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    const imageUrl=`${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl });
})

export const authRoutes = router;