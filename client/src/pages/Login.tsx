import { LoginForm } from '@features/LoginForm';
import axios from 'axios';

const Login = () => {
    const handleSubmit = async (data: { email: string; password: string }) => {
        try {
            const response = await axios.post("http://localhost:3000/auth/login", data);
            console.log("Login response:", response.data);

            alert("Login successful!");
            // Optionally, save token/session here
            // localStorage.setItem("token", response.data.token);
        } catch (err) {
            let message = "Server error";

            if (axios.isAxiosError(err)) {
                message = err.response?.data?.message || message;
                console.error("Login error:", err.response?.data || err.message);
            } else {
                console.error("Login error:", err);
            }

            alert("Login failed: " + message);
        }
    };

    return (
        <div className="mt-16">
            <LoginForm submitHandler={handleSubmit} />
        </div>
    );
};

export default Login;
