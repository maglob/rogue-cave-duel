if [ $# -eq 0 ]; then
    echo "usage: $0 <files>"
    exit 1
fi

echo "// This file was generated by running command"
echo "//     $0 $@"
echo 'shaders = {'
for FILE in "$@"; do
    echo -n "  '$(basename $FILE)':"
    cat $FILE | while IFS= read LINE; do
        echo "  \"$LINE \\n\"+";
    done
    echo '  "",'
done
echo '}'
