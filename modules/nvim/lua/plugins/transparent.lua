return {
  {
    "xiyaowong/transparent.nvim",
    lazy = false,
    priority = 1000,
    config = function()
      require("transparent").setup({})
      vim.cmd("TransparentEnable")
    end,
  },
}
