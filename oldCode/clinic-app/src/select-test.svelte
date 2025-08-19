<script>
    import Select from 'svelte-select';
  
    let options = [
      { value: 'one', label: 'Option One' },
      { value: 'two', label: 'Option Two' },
      { value: 'three', label: 'Option Three' }
    ];
  
    let selected = null;
  </script>
  
  <div style="padding:2rem; max-width:400px;">
    <h2>Test svelte-select</h2>
    <Select
      items={options}
      bind:value={selected}
      placeholder="Pick something..."
      clearable={false}
    />
    <p>Selected: {selected ? selected.label : 'none'}</p>
  </div>  