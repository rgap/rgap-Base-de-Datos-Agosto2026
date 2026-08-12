# Compila slides.tex -> build/slides.pdf con XeLaTeX.
$pdf_mode = 5;
$xelatex  = 'xelatex -interaction=nonstopmode -synctex=1 %O %S';
$out_dir  = 'build';
$clean_ext = 'nav snm xdv synctex.gz';
