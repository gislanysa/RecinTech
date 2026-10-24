-module(server_test_ffi).
-export([main/0]).

main() ->
    Options = [verbose, no_tty,
               {report, {gleeunit_progress, [{colored, true}]}},
               {scale_timeouts, 10}],
    Files = filelib:wildcard("**/*.{erl,gleam}", "test"),
    Modules = [to_module(list_to_binary(F)) || F <- Files],
    case eunit:test({inparallel, Modules}, Options) of
        ok -> erlang:halt(0);
        _  -> erlang:halt(1)
    end.

to_module(Path) ->
    case filename:extension(Path) of
        <<".gleam">> ->
            binary_to_atom(
              binary:replace(
                binary:replace(Path, <<".gleam">>, <<"">>),
                <<"/">>, <<"@">>, [global]),
              utf8);
        <<".erl">> ->
            binary_to_atom(
              binary:replace(lists:last(binary:split(Path, <<"/">>, [global])),
                <<".erl">>, <<"">>),
              utf8)
    end.
