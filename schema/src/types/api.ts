type CompositePart = Record<string, unknown>;

type OptionalComposite<T> = [T] extends [void] ? {} : T extends CompositePart ? T : never;

export type ApiRequest<
  TPrimary extends CompositePart,
  TSecondary extends CompositePart | void = void,
  TThird extends CompositePart | void = void,
  TFourth extends CompositePart | void = void,
  TFifth extends CompositePart | void = void
> = TPrimary &
  OptionalComposite<TSecondary> &
  OptionalComposite<TThird> &
  OptionalComposite<TFourth> &
  OptionalComposite<TFifth>;

export type ApiResponse<
  TPrimary extends CompositePart,
  TSecondary extends CompositePart | void = void,
  TThird extends CompositePart | void = void,
  TFourth extends CompositePart | void = void,
  TFifth extends CompositePart | void = void
> = TPrimary &
  OptionalComposite<TSecondary> &
  OptionalComposite<TThird> &
  OptionalComposite<TFourth> &
  OptionalComposite<TFifth>;

export type RequestBody<T> = { body: T };
export type RequestParams<T> = { params: T };
export type RequestQuery<T> = { query: T };
export type RequestHeaders<T> = { headers: T };
export type RequestMeta<T> = { meta: T };

export type ResponseData<T> = { data: T };
export type ResponseError<T> = { error: T };
export type ResponseMeta<T> = { meta: T };
export type ResponseStatus<T extends number> = { status: T };
export type ResponseHeaders<T> = { headers: T };
