import { BiSolidEnvelope, BiSolidLockAlt } from 'react-icons/bi';

export const LoginForm = () => {
    return (
        <form className="m-auto flex w-100 flex-col gap-4 rounded-2xl bg-neutral-100 px-16 py-8 shadow-lg">
            <div className="relative flex gap-2">
                <BiSolidEnvelope className="absolute left-2 size-6 self-center text-neutral-400" />
                <input
                    className="bg-neutral-150 w-full rounded-lg py-2 pr-4 pl-10 text-lg text-neutral-900"
                    type="email"
                    placeholder="Email"
                />
            </div>
            <div className="relative flex gap-2">
                <BiSolidLockAlt className="absolute left-2 size-6 self-center text-neutral-400" />
                <input
                    className="bg-neutral-150 w-full rounded-lg py-2 pr-4 pl-10 text-lg text-neutral-900"
                    type="password"
                    placeholder="Password"
                />
            </div>
            <button
                className="bg-primary-300 text-md mt-8 rounded-lg px-4 py-2"
                type="submit"
            >
                Login
            </button>
        </form>
    );
};
