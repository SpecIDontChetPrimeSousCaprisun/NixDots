return {
    'nvim-treesitter/nvim-treesitter',
    build = ":TSUpdate",
    lazy = false,
    config = function()
	require('nvim-treesitter').setup {
	    -- Directory to install parsers and queries to (prepended to `runtimepath` to have priority)
	    install_dir = '~/lazyPlugins/site'
	}
    end
}
