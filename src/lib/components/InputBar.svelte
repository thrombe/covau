<script lang="ts">

    export let value: string;
    export let placeholder: string;
    export let on_keydown = async (e: KeyboardEvent) => {};
    export let on_enter = async (e: KeyboardEvent) => {};

    const _on_keydown = async (e: KeyboardEvent) => {
        console.log(e);
        if (e.key === 'Enter') {
            e.preventDefault();
            await on_enter(e);
            input.blur();
        } else if (e.key == 'Escape') {
            e.preventDefault();
            input.blur();
        } else {
            await on_keydown(e);
        }
    };

    let input: HTMLElement;
</script>

<input
    {placeholder}
    bind:value
    on:keydown={_on_keydown}
    bind:this={input}
/>

<style>
    input {
        width: 100%;
        height: 100%;
        background-color: #ffffff00;
        border: 0px;
        text-align: center;
    }
    input:focus {
        border: none;
        outline: none;
    }
</style>
