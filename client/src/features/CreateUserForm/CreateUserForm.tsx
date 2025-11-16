import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { BiSolidEnvelope, BiSolidLockAlt, BiCheck } from 'react-icons/bi';

type CreateUserFormProps = {
    submitHandler: (data: FormInputs) => void;
};

type FormInputs = {
    email: string;
    password: string;
    confirmPassword: string;
};

export const CreateUserForm = ({ submitHandler }: CreateUserFormProps) => {
    const { register, handleSubmit } = useForm<FormInputs>();

    const onSubmit: SubmitHandler<FormInputs> = (data) => {
        submitHandler(data);
    };

    return (
        <form
            className="m-auto flex w-100 flex-col gap-4 rounded-2xl bg-neutral-100 px-16 py-8 shadow-lg"
            onSubmit={handleSubmit(onSubmit)}
        >
            <div className="relative flex gap-2">
                <BiSolidEnvelope className="absolute left-2 size-6 self-center text-neutral-400" />
                <input
                    className="bg-neutral-150 w-full rounded-lg py-2 pr-4 pl-10 text-lg text-neutral-900"
                    type="email"
                    placeholder="Email"
                    {...register('email')}
                />
            </div>
            <div className="relative flex gap-2">
                <BiSolidLockAlt className="absolute left-2 size-6 self-center text-neutral-400" />
                <input
                    className="bg-neutral-150 w-full rounded-lg py-2 pr-4 pl-10 text-lg text-neutral-900"
                    type="password"
                    placeholder="Password"
                    {...register('password')}
                />
            </div>
            <div className="relative flex gap-2">
                <BiCheck className="absolute left-2 size-6 self-center text-neutral-400" />
                <input
                    className="bg-neutral-150 w-full rounded-lg py-2 pr-4 pl-10 text-lg text-neutral-900"
                    type="password"
                    placeholder="Confirm Password"
                    {...register('confirmPassword')}
                />
            </div>
            <button
                className="bg-primary-300 text-md mt-8 rounded-lg px-4 py-2"
                type="submit"
            >
                Create New User
            </button>
        </form>
    );
};
